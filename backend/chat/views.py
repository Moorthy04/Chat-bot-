import json
from django.http import StreamingHttpResponse
from rest_framework import viewsets, status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Conversation, Message, Attachment
from .serializers import ConversationSerializer, ConversationDetailSerializer, MessageSerializer, AttachmentSerializer
from .services import AIEngine
from .utils import extract_text_from_file

class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        return Message.objects.filter(
            conversation__id=conversation_id,
            conversation__user=self.request.user
        )

class UploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES['file']
        attachment = Attachment.objects.create(
            user=request.user,
            file=uploaded_file,
            file_type=uploaded_file.content_type
        )
        
        # Trigger text extraction
        attachment.extracted_text = extract_text_from_file(attachment.file.path)
        attachment.save()
        
        return Response(AttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)

class ChatStreamView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        conversation_id = request.data.get('conversation_id')
        user_message_content = request.data.get('user_message')
        attachment_ids = request.data.get('attachment_ids', [])
        model = request.data.get('model', 'gemini')

        conversation = get_object_or_404(
            Conversation,
            id=conversation_id,
            user=request.user
        )

        # 1️⃣ Save User Message (DB — before generator starts)
        user_message = Message.objects.create(
            conversation=conversation,
            role='user',
            content=user_message_content
        )

        # Link attachments (DB — before generator starts)
        if attachment_ids:
            Attachment.objects.filter(
                id__in=attachment_ids,
                user=request.user
            ).update(message=user_message)

        # 2️⃣ Eagerly evaluate attachments queryset into a list
        #    CRITICAL: lazy QuerySets evaluated inside a StreamingHttpResponse
        #    generator may fail because Django closes the DB connection after
        #    the response has started streaming. list() forces evaluation NOW.
        attachments_list = list(
            Attachment.objects.filter(message=user_message)
        )

        # Build context string now (before generator)
        context_parts = []
        for att in attachments_list:
            if att.extracted_text:
                context_parts.append(
                    f"File: {att.file.name}\nContent: {att.extracted_text}"
                )
        full_context = "\n\n".join(context_parts)

        # 3️⃣ Prepare History (DB — before generator starts)
        history_msgs = list(
            conversation.messages.all().order_by('-created_at')[1:11]
        )
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(history_msgs)
        ]

        # 4️⃣ Pre-compute title if needed (DB write — before generator starts)
        ai_engine = AIEngine()
        if conversation.title == 'New Chat' or not conversation.title:
            try:
                new_title = ai_engine.generate_title(
                    user_message_content,
                    model=model
                )
                conversation.title = new_title
            except Exception:
                conversation.title = (user_message_content[:30] + "...") if len(user_message_content) > 30 else user_message_content
            conversation.save()

        # 5️⃣ Generator — NO DB reads here, only AI streaming + yielding
        def stream_generator():
            assistant_content = ""
            try:
                for chunk in ai_engine.get_streaming_response(
                    user_message_content,
                    history,
                    full_context,
                    model=model,
                    attachments=attachments_list
                ):
                    assistant_content += chunk
                    yield f"data: {json.dumps(chunk)}\n\n".encode("utf-8")

            except Exception as e:
                # Yield the error as a visible message instead of crashing with 500
                error_msg = f"\n\n**[Error]** {str(e)}"
                assistant_content += error_msg
                yield f"data: {error_msg}\n\n".encode("utf-8")

            finally:
                # Save assistant message after stream completes
                # This runs after all chunks are yielded
                try:
                    Message.objects.create(
                        conversation=conversation,
                        role='assistant',
                        content=assistant_content
                    )
                except Exception:
                    pass  # Don't crash if save fails after streaming
                yield b"data: [DONE]\n\n"

        response = StreamingHttpResponse(
            stream_generator(),
            content_type="text/event-stream"
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"

        return response
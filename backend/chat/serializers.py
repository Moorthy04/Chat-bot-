from rest_framework import serializers
from .models import Conversation, Message, Attachment

class AttachmentSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ('id', 'file', 'file_type', 'extracted_text', 'created_at', 'name')

    def get_name(self, obj):
        import os
        return os.path.basename(obj.file.name)

class MessageSerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'role', 'content', 'created_at', 'attachments')

class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ('id', 'title', 'created_at', 'updated_at')

class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ('id', 'title', 'messages', 'created_at', 'updated_at')

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, MessageViewSet, UploadView, ChatStreamView

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('conversations/<uuid:conversation_id>/messages/', MessageViewSet.as_view({'get': 'list'}), name='conversation-messages'),
    path('upload/', UploadView.as_view(), name='file-upload'),
    path('chat/stream/', ChatStreamView.as_view(), name='chat-stream'),
]

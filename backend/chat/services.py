from django.conf import settings
from google import genai
from google.genai import types

class AIEngine:
    def __init__(self):
        self.gemini_model_name = 'gemini-2.5-flash'
        self.model_key_map = {
            'gemini': getattr(settings, 'GEMINI_API_KEY', ''),
            'gpt': getattr(settings, 'OPENAI_API_KEY', ''),
            'claude': getattr(settings, 'CLAUDE_API_KEY', '')
        }

    def _get_client(self, model_type):
        """Get a Gemini client for the specific model type"""
        key = self.model_key_map.get(model_type, self.model_key_map['gemini'])
        if not key:
            # Fallback to any available key if specific one is missing
            for k in self.model_key_map.values():
                if k:
                    key = k
                    break
        
        return genai.Client(api_key=key) if key else None

    def get_streaming_response(self, user_message, history=None, context=None, model="gemini-2.5-flash", attachments=None):
        """Main entry point for streaming responses with model routing"""
        client = self._get_client(model)
        
        try:
            if not client:
                raise Exception(f"API key for {model} not configured.")
            
            yield from self._get_gemini_response(client, user_message, history, context, attachments)
        except Exception as e:
            error_str = str(e).upper()
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                model_name = model.upper() if model != 'gpt' else 'GPT'
                yield f"\n\n⚠️ {model_name} is currently unavailable. Try switching to other models! 🙏\n"
            else:
                yield f"\n\n**[Error]** {str(e)}\n"

    def _get_gemini_response(self, client, user_message, history=None, context=None, attachments=None):
        contents = []
        if history:
            for h in history:
                role = "user" if h["role"] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h["content"])]))
    
        user_parts = []

        if attachments:
            for attachment in attachments:
                try:
                    mime_type = attachment.file_type or 'application/octet-stream'
                    if mime_type.startswith('image/'):
                        with open(attachment.file.path, 'rb') as f:
                            image_bytes = f.read()
                        user_parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
                    elif attachment.extracted_text:
                        user_parts.append(types.Part.from_text(
                        text=f"[File: {attachment.file.name}]\n{attachment.extracted_text}"
                    ))
                except Exception as e:
                    print(f"Error processing attachment: {e}")

        if context:
            user_parts.append(types.Part.from_text(text=f"Context from uploaded files:\n{context}\n\nUser Question: {user_message}"))
        else:
            user_parts.append(types.Part.from_text(text=user_message))

        contents.append(types.Content(role="user", parts=user_parts))

        response = client.models.generate_content_stream(
            model=self.gemini_model_name,
            contents=contents,
            config=types.GenerateContentConfig(temperature=0.7)
        )

        for chunk in response:
            if chunk.text:
                yield chunk.text

    def generate_title(self, user_message, model="gemini-2.5-flash"):
        """Generate a concise title"""
        words = user_message.split()[:5]
        return " ".join(words) + ("..." if len(user_message.split()) > 5 else "")

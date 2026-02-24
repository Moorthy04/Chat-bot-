import os
import mimetypes
from django.conf import settings
from PyPDF2 import PdfReader

def extract_text_from_file(file_path):
    file_type, _ = mimetypes.guess_type(file_path)
    file_type = file_type or 'application/octet-stream'
    
    extension = os.path.splitext(file_path)[1].lower()
    
    text = ""
    try:
        if extension == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        elif extension == '.pdf':
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif file_type.startswith('image/'):
            text = f"[Image File: {os.path.basename(file_path)}]"
        else:
            text = f"[Generic File Content: {os.path.basename(file_path)}]"
    except Exception as e:
        text = f"Error extracting text: {str(e)}"
        
    return text[:5000] # Limit context size

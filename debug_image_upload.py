#!/usr/bin/env python3
"""
Individual test for image upload to debug the issue
"""

import requests
import json
import io
from PIL import Image

BASE_URL = "http://127.0.0.1:3100"
API_BASE = f"{BASE_URL}/api"
ADMIN_EMAIL = "contact@nexus-conseil.ch"
ADMIN_PASSWORD = "Greeters&58!2026"

def test_image_upload():
    session = requests.Session()
    
    # Login first
    print("Logging in...")
    login_response = session.post(f"{API_BASE}/auth/login", 
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, 
        timeout=10)
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code}")
        return False
    
    print("Login successful")
    
    # Try image upload
    print("Creating test image...")
    img = Image.new('RGB', (100, 100), color='red')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    print("Uploading image...")
    files = {'file': ('test.png', img_buffer, 'image/png')}
    
    try:
        response = session.post(f"{API_BASE}/admin/images/upload", files=files, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Image data: {data}")
            return True
        else:
            print(f"Failed with status {response.status_code}")
            return False
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_image_upload()
    print(f"Result: {'PASS' if success else 'FAIL'}")
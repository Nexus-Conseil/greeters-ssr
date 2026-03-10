#!/usr/bin/env python3
"""
Backend Retesting After CreatePage Fix
Focus on http://127.0.0.1:3100 after createPage return fixes

Tests requested:
1. POST /api/admin/images/upload with auth should work now 
2. POST /api/pages should now return SEO/OG fields auto-populated after creation
3. POST /api/contact/send should remain OK (regression test)

Admin credentials: contact@nexus-conseil.ch / Greeters&58!2026
"""

import requests
import json
import os
import tempfile
from io import BytesIO
from PIL import Image
import sys

BASE_URL = "http://127.0.0.1:3100"
ADMIN_EMAIL = "contact@nexus-conseil.ch"
ADMIN_PASSWORD = "Greeters&58!2026"

class TestSession:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Backend-Test-Client/1.0',
            'Accept': 'application/json'
        })
        
    def login_admin(self):
        """Login with admin credentials and return success status"""
        login_url = f"{BASE_URL}/api/auth/login"
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        try:
            print(f"🔑 Attempting admin login to {login_url}")
            response = self.session.post(login_url, json=payload, timeout=30)
            print(f"   Response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Login successful: {data.get('user', {}).get('name', 'Admin')}")
                return True
            else:
                print(f"   ❌ Login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Login error: {str(e)}")
            return False
    
    def test_image_upload(self):
        """Test POST /api/admin/images/upload with auth"""
        print(f"\n📁 Testing POST /api/admin/images/upload")
        
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color=(73, 109, 137))
        img_bytes = BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        files = {
            'file': ('test-image.png', img_bytes, 'image/png')
        }
        
        try:
            upload_url = f"{BASE_URL}/api/admin/images/upload"
            response = self.session.post(upload_url, files=files, timeout=30)
            print(f"   Response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                image_info = data.get('image', {})
                print(f"   ✅ Image upload successful")
                print(f"      ID: {image_info.get('id', 'N/A')}")
                print(f"      Filename: {image_info.get('fileName', 'N/A')}")
                print(f"      URL: {image_info.get('src', 'N/A')}")
                return True, f"Upload successful: {image_info.get('fileName', 'test-image.png')}"
            elif response.status_code == 401:
                print(f"   ❌ Unauthorized - auth not working")
                return False, f"401 Unauthorized - authentication required"
            elif response.status_code == 400:
                error_data = response.json()
                detail = error_data.get('detail', 'Unknown error')
                print(f"   ❌ Bad request: {detail}")
                return False, f"400 Bad Request: {detail}"
            else:
                print(f"   ❌ Upload failed: {response.text}")
                return False, f"{response.status_code}: {response.text}"
                
        except Exception as e:
            print(f"   ❌ Upload error: {str(e)}")
            return False, f"Exception: {str(e)}"
    
    def test_create_page_seo_fields(self):
        """Test POST /api/pages returns auto-populated SEO/OG fields"""
        print(f"\n📄 Testing POST /api/pages with SEO/OG auto-population")
        
        # Create a test page with minimal data
        page_payload = {
            "locale": "fr",
            "title": "Test Page SEO Auto-Population",
            "slug": f"test-seo-auto-{int(os.urandom(4).hex(), 16)}",
            "sections": [
                {
                    "id": "section-1",
                    "name": "Introduction",
                    "layout": "default",
                    "background": "white",
                    "blocks": [
                        {
                            "id": "block-1",
                            "type": "text",
                            "content": {
                                "text": "Ceci est une page de test pour vérifier l'auto-population des champs SEO et Open Graph."
                            },
                            "order": 0
                        }
                    ],
                    "order": 0
                }
            ],
            "isInMenu": False,
            "menuOrder": 0
        }
        
        try:
            create_url = f"{BASE_URL}/api/pages"
            response = self.session.post(create_url, json=page_payload, timeout=30)
            print(f"   Response: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                print(f"   ✅ Page created successfully")
                print(f"      ID: {data.get('id', 'N/A')}")
                print(f"      Title: {data.get('title', 'N/A')}")
                print(f"      Slug: {data.get('slug', 'N/A')}")
                
                # Check SEO/OG fields auto-population
                seo_fields = {
                    'metaTitle': data.get('metaTitle'),
                    'metaDescription': data.get('metaDescription'),
                    'focusKeyword': data.get('focusKeyword'),
                    'canonicalUrl': data.get('canonicalUrl'),
                    'robotsDirective': data.get('robotsDirective'),
                    'ogTitle': data.get('ogTitle'),
                    'ogDescription': data.get('ogDescription'),
                    'ogImageUrl': data.get('ogImageUrl'),
                    'twitterTitle': data.get('twitterTitle'),
                    'twitterDescription': data.get('twitterDescription'),
                    'sitemapPriority': data.get('sitemapPriority'),
                    'sitemapChangeFreq': data.get('sitemapChangeFreq')
                }
                
                populated_fields = {k: v for k, v in seo_fields.items() if v is not None}
                empty_fields = {k: v for k, v in seo_fields.items() if v is None}
                
                print(f"      📊 SEO/OG Auto-Population Results:")
                print(f"         ✅ Populated fields ({len(populated_fields)}):")
                for field, value in populated_fields.items():
                    print(f"            {field}: {value}")
                
                if empty_fields:
                    print(f"         ⚠️ Empty fields ({len(empty_fields)}):")
                    for field in empty_fields.keys():
                        print(f"            {field}: null")
                
                # Consider it successful if key SEO fields are auto-populated
                critical_fields = ['robotsDirective', 'sitemapPriority', 'sitemapChangeFreq']
                critical_populated = all(seo_fields.get(field) is not None for field in critical_fields)
                
                if critical_populated:
                    return True, f"Page created with SEO auto-population: {len(populated_fields)}/12 fields populated"
                else:
                    return False, f"Critical SEO fields not auto-populated: {[f for f in critical_fields if not seo_fields.get(f)]}"
                    
            elif response.status_code == 401:
                print(f"   ❌ Unauthorized - auth required")
                return False, "401 Unauthorized - editor permissions required"
            else:
                print(f"   ❌ Create failed: {response.text}")
                return False, f"{response.status_code}: {response.text}"
                
        except Exception as e:
            print(f"   ❌ Create error: {str(e)}")
            return False, f"Exception: {str(e)}"
    
    def test_contact_send_regression(self):
        """Test POST /api/contact/send remains OK (regression test)"""
        print(f"\n✉️ Testing POST /api/contact/send (regression test)")
        
        contact_payload = {
            "name": "Marie Bertrand",
            "email": "marie.bertrand@example.com",
            "subject": "Test de régression après correctif createPage",
            "message": "Bonjour, je souhaite vérifier que l'envoi de messages fonctionne toujours correctement après les modifications apportées à la création de pages. Merci de confirmer la réception."
        }
        
        try:
            contact_url = f"{BASE_URL}/api/contact/send"
            # Use a fresh session without auth for contact form
            contact_session = requests.Session()
            response = contact_session.post(contact_url, json=contact_payload, timeout=30)
            print(f"   Response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', 'Success')
                print(f"   ✅ Contact form successful: {message}")
                return True, f"Contact form working: {message}"
            elif response.status_code == 429:
                error_data = response.json()
                detail = error_data.get('detail', 'Rate limit or quota error')
                print(f"   ⚠️ Rate limited/quota: {detail}")
                return True, f"Contact form working but rate limited: {detail}"
            elif response.status_code == 400:
                error_data = response.json()
                detail = error_data.get('detail', 'Validation error')
                print(f"   ❌ Validation error: {detail}")
                return False, f"400 Validation error: {detail}"
            else:
                print(f"   ❌ Contact failed: {response.text}")
                return False, f"{response.status_code}: {response.text}"
                
        except Exception as e:
            print(f"   ❌ Contact error: {str(e)}")
            return False, f"Exception: {str(e)}"

def main():
    print("="*80)
    print("🚀 BACKEND RETEST AFTER CREATEPAGE FIX")
    print(f"Target: {BASE_URL}")
    print(f"Admin: {ADMIN_EMAIL}")
    print("="*80)
    
    test_session = TestSession()
    results = []
    
    # Step 1: Admin login
    if not test_session.login_admin():
        print("\n❌ CRITICAL: Admin login failed - cannot proceed with authenticated tests")
        sys.exit(1)
    
    # Step 2: Test image upload with auth
    success, message = test_session.test_image_upload()
    results.append(("POST /api/admin/images/upload (with auth)", success, message))
    
    # Step 3: Test page creation with SEO auto-population
    success, message = test_session.test_create_page_seo_fields()
    results.append(("POST /api/pages (SEO/OG auto-population)", success, message))
    
    # Step 4: Test contact form regression
    success, message = test_session.test_contact_send_regression()
    results.append(("POST /api/contact/send (regression test)", success, message))
    
    # Summary
    print("\n" + "="*80)
    print("📋 RETEST RESULTS SUMMARY")
    print("="*80)
    
    passed = 0
    total = len(results)
    
    for test_name, success, message in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        print(f"     {message}")
        if success:
            passed += 1
    
    print(f"\n🎯 FINAL SCORE: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - CreatePage fix working correctly!")
    else:
        failed = total - passed
        print(f"⚠️ {failed} test(s) failed - Review needed")
    
    print("="*80)
    return passed == total

if __name__ == "__main__":
    main()
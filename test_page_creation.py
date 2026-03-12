#!/usr/bin/env python3
"""
Test page creation with SEO auto-population
"""

import requests
import json

def test_create_page():
    # Step 1: Login and get session
    session = requests.Session()
    
    login_response = session.post("http://127.0.0.1:3100/api/auth/login", 
                                 json={"email": "contact@nexus-conseil.ch", 
                                      "password": "Greeters&58!2026"})
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code}")
        return False
    
    print("✅ Login successful")
    
    # Step 2: Create page
    page_data = {
        "locale": "fr",
        "title": "Page de Test SEO",
        "slug": "test-seo-creation-20260310",
        "sections": [
            {
                "id": "section-1",
                "name": "Test Section",
                "layout": "default", 
                "background": "white",
                "blocks": [
                    {
                        "id": "block-1",
                        "type": "text",
                        "content": {"text": "Contenu de test pour vérifier l'auto-population SEO"},
                        "order": 0
                    }
                ],
                "order": 0
            }
        ],
        "isInMenu": False,
        "menuOrder": 0
    }
    
    print("📄 Creating page...")
    create_response = session.post("http://127.0.0.1:3100/api/pages", 
                                  json=page_data, 
                                  timeout=60)
    
    print(f"Status: {create_response.status_code}")
    
    if create_response.status_code == 201:
        result = create_response.json()
        print("✅ Page created successfully")
        print(f"ID: {result.get('id')}")
        print(f"Title: {result.get('title')}")
        
        # Check SEO fields
        seo_fields = {
            'metaTitle': result.get('metaTitle'),
            'metaDescription': result.get('metaDescription'),
            'robotsDirective': result.get('robotsDirective'),
            'ogTitle': result.get('ogTitle'),
            'ogDescription': result.get('ogDescription'),
            'sitemapPriority': result.get('sitemapPriority'),
            'sitemapChangeFreq': result.get('sitemapChangeFreq'),
            'canonicalUrl': result.get('canonicalUrl')
        }
        
        print("\n📊 SEO Fields:")
        populated = 0
        for field, value in seo_fields.items():
            if value is not None:
                populated += 1
                print(f"  ✅ {field}: {value}")
            else:
                print(f"  ❌ {field}: null")
        
        print(f"\n🎯 SEO Auto-population: {populated}/{len(seo_fields)} fields populated")
        return populated > 0
    else:
        print(f"❌ Page creation failed: {create_response.text}")
        return False

if __name__ == "__main__":
    test_create_page()
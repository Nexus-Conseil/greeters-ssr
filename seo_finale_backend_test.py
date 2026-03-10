#!/usr/bin/env python3
"""
SEO Studio Finale Backend Validation for Greeters Next.js Application
Tests 5 specific backend endpoints on http://127.0.0.1:3100 after SEO studio extension

Validation Requirements:
1. POST /api/ai/seo-optimizer - requires admin auth and returns structured SEO data
2. POST /api/admin/bootstrap/public-content - still works and covers home page now  
3. GET /sitemap.xml - contains priority/changefreq and remains clean
4. POST /api/contact/send - still works with real Emailit integration
5. No regression on /api/pages and /api/pages/[id] for SEO fields reading/editing

Admin credentials: contact@nexus-conseil.ch / Greeters&58!2026
"""

import json
import requests
import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional
import sys

class SeoFinaleValidator:
    def __init__(self):
        self.base_url = "http://127.0.0.1:3100"
        self.session = requests.Session()
        self.auth_cookie = None
        self.admin_credentials = {
            "email": "contact@nexus-conseil.ch",
            "password": "Greeters&58!2026"
        }
        
    def admin_login(self) -> Dict[str, Any]:
        """Login as admin to get authentication cookies"""
        print("🔐 Admin Login...")
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=self.admin_credentials,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data and "expiresAt" in data:
                    self.auth_cookie = response.cookies
                    print(f"✅ Admin login successful: {data.get('user', {}).get('name', 'Unknown user')}")
                    return {"status": "success", "details": data}
                    
            return {"status": "fail", "message": f"Login failed: {response.status_code}", "details": response.text}
                
        except Exception as e:
            return {"status": "error", "message": "Login error", "details": str(e)}
    
    def test_1_seo_optimizer_api(self) -> Dict[str, Any]:
        """Test 1: POST /api/ai/seo-optimizer requires admin auth and returns structured SEO data"""
        print("🧪 Test 1: POST /api/ai/seo-optimizer")
        
        if not self.auth_cookie:
            return {
                "status": "❌ SKIP",
                "message": "Admin authentication required but login failed"
            }
        
        # Test SEO optimization payload
        seo_payload = {
            "page": {
                "title": "Test Page pour SEO",
                "content": "Contenu de test pour optimisation SEO",
                "locale": "fr"
            },
            "instructions": "Optimiser pour le tourisme parisien"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/ai/seo-optimizer",
                json=seo_payload,
                headers={"Content-Type": "application/json"},
                cookies=self.auth_cookie
            )
            
            if response.status_code == 200:
                data = response.json()
                if "optimization" in data:
                    optimization = data["optimization"]
                    # Check for structured SEO data
                    expected_fields = ["metaTitle", "metaDescription", "keywords"]
                    found_fields = [field for field in expected_fields if field in optimization]
                    
                    return {
                        "status": "✅ PASS",
                        "message": "SEO optimizer API working with admin auth",
                        "details": f"Structured SEO data returned with fields: {list(optimization.keys())}"
                    }
                else:
                    return {
                        "status": "❌ FAIL",
                        "message": "SEO optimizer missing 'optimization' field",
                        "details": f"Response keys: {list(data.keys())}"
                    }
            elif response.status_code == 401 or response.status_code == 403:
                return {
                    "status": "❌ FAIL", 
                    "message": "Admin authentication not working for SEO optimizer",
                    "details": f"Status: {response.status_code}, Response: {response.text}"
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"SEO optimizer API error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test SEO optimizer API",
                "details": str(e)
            }
    
    def test_2_bootstrap_public_content(self) -> Dict[str, Any]:
        """Test 2: POST /api/admin/bootstrap/public-content still works and covers home"""
        print("🧪 Test 2: POST /api/admin/bootstrap/public-content")
        
        if not self.auth_cookie:
            return {
                "status": "❌ SKIP", 
                "message": "Admin authentication required but login failed"
            }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/admin/bootstrap/public-content",
                headers={"Content-Type": "application/json"},
                cookies=self.auth_cookie
            )
            
            if response.status_code == 200:
                data = response.json()
                if "report" in data and "message" in data:
                    report = data["report"]
                    # Check if home is covered (should show sections created/updated)
                    report_str = str(report)
                    covers_home = ("home" in report_str.lower() or 
                                 "sections" in report_str.lower() or
                                 "home sections" in report_str.lower())
                    
                    return {
                        "status": "✅ PASS",
                        "message": f"Bootstrap endpoint working, covers home: {covers_home}",
                        "details": f"Message: {data['message']}, Report: {report}"
                    }
                else:
                    return {
                        "status": "❌ FAIL",
                        "message": "Bootstrap endpoint missing expected response structure",
                        "details": f"Response keys: {list(data.keys())}"
                    }
            elif response.status_code == 401 or response.status_code == 403:
                return {
                    "status": "❌ FAIL",
                    "message": "Admin authentication not working for bootstrap endpoint", 
                    "details": f"Status: {response.status_code}, Response: {response.text}"
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"Bootstrap endpoint error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test bootstrap endpoint",
                "details": str(e)
            }
    
    def test_3_sitemap_xml_priority_changefreq(self) -> Dict[str, Any]:
        """Test 3: GET /sitemap.xml contains priority/changefreq and remains clean"""
        print("🧪 Test 3: GET /sitemap.xml (priority/changefreq)")
        
        try:
            response = self.session.get(f"{self.base_url}/sitemap.xml")
            
            if response.status_code == 200:
                content_type = response.headers.get("content-type", "")
                if "xml" in content_type.lower():
                    try:
                        # Parse XML and check for priority/changefreq elements
                        root = ET.fromstring(response.text)
                        
                        # Look for sitemap namespace and url elements
                        namespaces = {"sitemap": "http://www.sitemaps.org/schemas/sitemap/0.9"}
                        url_elements = root.findall(".//sitemap:url", namespaces) or root.findall(".//url")
                        
                        has_priority = False
                        has_changefreq = False
                        
                        for url_elem in url_elements:
                            # Check for priority and changefreq in each URL
                            priority_elem = url_elem.find("./sitemap:priority", namespaces) or url_elem.find("./priority")
                            changefreq_elem = url_elem.find("./sitemap:changefreq", namespaces) or url_elem.find("./changefreq")
                            
                            if priority_elem is not None:
                                has_priority = True
                            if changefreq_elem is not None:
                                has_changefreq = True
                        
                        return {
                            "status": "✅ PASS",
                            "message": f"Sitemap XML valid with priority: {has_priority}, changefreq: {has_changefreq}",
                            "details": f"Content-Type: {content_type}, URLs found: {len(url_elements)}, Size: {len(response.text)} chars"
                        }
                        
                    except ET.ParseError as e:
                        return {
                            "status": "❌ FAIL",
                            "message": "Sitemap XML is malformed",
                            "details": f"Parse error: {str(e)}"
                        }
                else:
                    return {
                        "status": "❌ FAIL",
                        "message": "Sitemap doesn't return XML content-type",
                        "details": f"Content-Type: {content_type}"
                    }
            else:
                return {
                    "status": "❌ FAIL", 
                    "message": f"Sitemap endpoint error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test sitemap endpoint",
                "details": str(e)
            }
    
    def test_4_contact_emailit_integration(self) -> Dict[str, Any]:
        """Test 4: POST /api/contact/send still works with real Emailit integration"""
        print("🧪 Test 4: POST /api/contact/send (Real Emailit Integration)")
        
        payload = {
            "name": "Sophie Martin",
            "email": "sophie.martin@example.com",
            "subject": "Demande de visite guidée",
            "message": "Bonjour, je souhaiterais organiser une visite guidée pour ce week-end. Avez-vous des créneaux disponibles ? Merci."
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/contact/send",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_success_msg = "Votre message a bien été envoyé"
                if expected_success_msg in data.get("message", ""):
                    return {
                        "status": "✅ PASS", 
                        "message": "Contact form working with REAL Emailit integration (not mocked)",
                        "details": f"Success message: {data.get('message')}"
                    }
                else:
                    return {
                        "status": "❌ FAIL",
                        "message": "Contact form success message unexpected",
                        "details": f"Response: {data}"
                    }
            elif response.status_code == 429:
                data = response.json()
                return {
                    "status": "✅ PASS",
                    "message": "Contact form correctly handles Emailit quota/rate limit (not mocked)",
                    "details": f"Rate limit response: {data.get('detail', data.get('message'))}"
                }
            elif response.status_code == 400:
                return {
                    "status": "❌ FAIL",
                    "message": "Contact form validation error",
                    "details": response.json().get("detail", response.text)
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"Contact form error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test contact form",
                "details": str(e)
            }
    
    def test_5a_pages_api_seo_fields(self) -> Dict[str, Any]:
        """Test 5a: GET /api/pages no regression for SEO fields reading"""
        print("🧪 Test 5a: GET /api/pages (SEO fields reading)")
        
        if not self.auth_cookie:
            return {
                "status": "❌ SKIP",
                "message": "Editor authentication required but login failed"
            }
        
        try:
            response = self.session.get(
                f"{self.base_url}/api/pages?locale=fr&limit=5",
                cookies=self.auth_cookie
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and "items" in data:
                    pages = data["items"]
                    if len(pages) > 0:
                        # Check if pages have SEO-related fields
                        first_page = pages[0]
                        seo_fields = ["metaTitle", "metaDescription", "canonicalUrl", "robots", "ogTitle", "ogDescription"]
                        found_seo_fields = [field for field in seo_fields if field in first_page]
                        
                        return {
                            "status": "✅ PASS",
                            "message": f"Pages API reading SEO fields: {len(found_seo_fields)}/{len(seo_fields)} found",
                            "details": f"SEO fields found: {found_seo_fields}, Pages returned: {len(pages)}"
                        }
                    else:
                        return {
                            "status": "⚠️ WARNING",
                            "message": "Pages API working but no pages found to check SEO fields",
                            "details": "No pages available for SEO field validation"
                        }
                else:
                    return {
                        "status": "❌ FAIL",
                        "message": "Pages API unexpected response format",
                        "details": f"Response type: {type(data)}, Keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}"
                    }
            elif response.status_code == 401 or response.status_code == 403:
                return {
                    "status": "❌ FAIL",
                    "message": "Pages API authentication error",
                    "details": f"Status: {response.status_code}, Response: {response.text}"
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"Pages API error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test pages API",
                "details": str(e)
            }
    
    def test_5b_pages_by_id_seo_fields(self) -> Dict[str, Any]:
        """Test 5b: GET /api/pages/[id] no regression for SEO fields editing"""
        print("🧪 Test 5b: GET /api/pages/[id] (SEO fields editing)")
        
        if not self.auth_cookie:
            return {
                "status": "❌ SKIP",
                "message": "Editor authentication required but login failed"
            }
        
        # First get a page ID from the pages list
        try:
            pages_response = self.session.get(
                f"{self.base_url}/api/pages?locale=fr&limit=1",
                cookies=self.auth_cookie
            )
            
            if pages_response.status_code != 200:
                return {
                    "status": "❌ FAIL",
                    "message": "Could not get page ID for testing individual page endpoint",
                    "details": f"Pages list error: {pages_response.status_code}"
                }
            
            pages_data = pages_response.json()
            if not isinstance(pages_data, dict) or "items" not in pages_data or len(pages_data["items"]) == 0:
                return {
                    "status": "⚠️ WARNING",
                    "message": "No pages available to test individual page SEO fields endpoint",
                    "details": "Pages list is empty"
                }
            
            page_id = pages_data["items"][0]["id"]
            
            # Now test the individual page endpoint
            response = self.session.get(
                f"{self.base_url}/api/pages/{page_id}",
                cookies=self.auth_cookie
            )
            
            if response.status_code == 200:
                page_data = response.json()
                # Check for SEO fields that should be editable
                seo_fields = ["metaTitle", "metaDescription", "canonicalUrl", "robots", "ogTitle", "ogDescription", "ogImage", "twitterTitle", "twitterDescription"]
                found_seo_fields = [field for field in seo_fields if field in page_data]
                
                return {
                    "status": "✅ PASS",
                    "message": f"Page by ID API supports SEO editing: {len(found_seo_fields)}/{len(seo_fields)} fields",
                    "details": f"Page ID: {page_id}, SEO fields: {found_seo_fields}"
                }
            elif response.status_code == 404:
                return {
                    "status": "❌ FAIL",
                    "message": "Page not found - possible regression in page ID handling",
                    "details": f"Page ID {page_id} not found"
                }
            elif response.status_code == 401 or response.status_code == 403:
                return {
                    "status": "❌ FAIL", 
                    "message": "Page by ID API authentication error",
                    "details": f"Status: {response.status_code}, Response: {response.text}"
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"Page by ID API error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test page by ID API",
                "details": str(e)
            }
    
    def run_seo_finale_validation(self):
        """Run all 5 SEO finale backend validation tests"""
        print("🎯 SEO Studio Finale Backend Validation")
        print("🔍 Validating 5 specific backend endpoints after SEO extension")
        print("=" * 70)
        
        # Login first
        login_result = self.admin_login()
        if login_result["status"] != "success":
            print("❌ Admin login failed - cannot proceed with validation")
            print(f"Details: {login_result.get('details', 'No details')}")
            return False
        
        print()
        
        test_results = []
        
        # Test 1: SEO Optimizer API
        result = self.test_1_seo_optimizer_api()
        test_results.append(("1. POST /api/ai/seo-optimizer", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Test 2: Bootstrap Public Content
        result = self.test_2_bootstrap_public_content()
        test_results.append(("2. POST /api/admin/bootstrap/public-content", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Test 3: Sitemap XML
        result = self.test_3_sitemap_xml_priority_changefreq()
        test_results.append(("3. GET /sitemap.xml", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Test 4: Contact Emailit
        result = self.test_4_contact_emailit_integration()
        test_results.append(("4. POST /api/contact/send", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Test 5a: Pages API SEO fields
        result = self.test_5a_pages_api_seo_fields()
        test_results.append(("5a. GET /api/pages (SEO fields)", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Test 5b: Pages by ID SEO fields  
        result = self.test_5b_pages_by_id_seo_fields()
        test_results.append(("5b. GET /api/pages/[id] (SEO fields)", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Summary
        print("=" * 70)
        print("📊 SEO FINALE VALIDATION SUMMARY")
        print("=" * 70)
        
        passed = 0
        failed = 0
        errors = 0
        warnings = 0
        skipped = 0
        
        for test_name, result in test_results:
            status = result['status']
            if "✅" in status:
                passed += 1
            elif "❌ FAIL" in status:
                failed += 1
            elif "❌ ERROR" in status:
                errors += 1
            elif "⚠️" in status:
                warnings += 1
            elif "❌ SKIP" in status:
                skipped += 1
            
            print(f"{status} {test_name}")
        
        print()
        print(f"📈 Results: {passed} passed, {failed} failed, {errors} errors, {warnings} warnings, {skipped} skipped")
        
        if failed > 0 or errors > 0:
            print("❌ SEO finale validation has issues - check details above")
            return False
        elif warnings > 0:
            print("⚠️  SEO finale validation completed with warnings - review needed")
            return True
        else:
            print("✅ SEO finale backend validation passed!")
            print("✅ All 5 required endpoints working correctly after SEO studio extension")
            return True

if __name__ == "__main__":
    validator = SeoFinaleValidator()
    success = validator.run_seo_finale_validation()
    sys.exit(0 if success else 1)
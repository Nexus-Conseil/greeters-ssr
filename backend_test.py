#!/usr/bin/env python3
"""
Backend Testing Script for Greeters Next.js Application
Tests critical backend API endpoints on http://127.0.0.1:3100

SECURITY REGRESSION TEST - POST ADMIN SECURITY FIX:
1. GET /admin/pages without session - should redirect 307 to /admin/login
2. GET /api/menu without session - should return 401/403 (not 200)
3. Authentication and POST login functionality  
4. GET /api/menu after authentication - should work
5. POST /api/contact/send regression test - should work without issues

Additional Test Cases:
6. POST /api/ai/page-generator - Gemini AI integration
7. Multi-turn conversation on /api/ai/page-generator
8. GET /sitemap.xml - XML sitemap validation
"""

import json
import requests
import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional
import sys

class GreetersTester:
    def __init__(self):
        self.base_url = "http://127.0.0.1:3100"
        self.session = requests.Session()
        self.auth_cookie = None
        
    def test_contact_send_real_sendgrid(self) -> Dict[str, Any]:
        """Test POST /api/contact/send with valid payload - should call real SendGrid"""
        print("🧪 Testing POST /api/contact/send (Real SendGrid Integration)")
        
        payload = {
            "name": "Jean Dupont",
            "email": "jean.dupont@example.com", 
            "subject": "Test d'intégration API",
            "message": "Ceci est un test d'intégration de l'API de contact avec SendGrid. Veuillez ignorer ce message."
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/contact/send",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            # Check if we get proper SendGrid quota/credit error (not a success)
            if response.status_code == 429:
                data = response.json()
                if "quota" in data.get("detail", "").lower() or "crédit" in data.get("detail", "").lower():
                    return {
                        "status": "✅ PASS",
                        "message": "Real SendGrid integration working - quota/credit error as expected",
                        "details": f"Status: {response.status_code}, Error: {data.get('detail')}",
                        "is_mocked": False
                    }
            
            # If we get a 200, verify it's truly sent (not mocked)
            elif response.status_code == 200:
                return {
                    "status": "⚠️ WARNING", 
                    "message": "Got success response - verify this is real SendGrid, not mocked",
                    "details": f"Response: {response.json()}",
                    "is_mocked": "Unknown - needs verification"
                }
            
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"Unexpected response from contact endpoint",
                    "details": f"Status: {response.status_code}, Response: {response.text}",
                    "is_mocked": False
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to call contact endpoint", 
                "details": str(e)
            }
    
    def test_contact_invalid_payload(self) -> Dict[str, Any]:
        """Test POST /api/contact/send with invalid payload - should return 400"""
        print("🧪 Testing POST /api/contact/send (Invalid Payload)")
        
        invalid_payload = {"name": "Test"}  # Missing required fields
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/contact/send",
                json=invalid_payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 400:
                return {
                    "status": "✅ PASS",
                    "message": "Invalid payload correctly rejected with 400",
                    "details": f"Response: {response.json()}"
                }
            else:
                return {
                    "status": "❌ FAIL", 
                    "message": f"Expected 400 for invalid payload, got {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test invalid payload",
                "details": str(e)
            }
    
    def test_auth_login(self) -> Dict[str, Any]:
        """Test POST /api/auth/login with provided credentials"""
        print("🧪 Testing POST /api/auth/login")
        
        login_payload = {
            "email": "contact@nexus-conseil.ch",
            "password": "Greeters&58!2026"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=login_payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data and "expiresAt" in data:
                    # Save cookies for authenticated requests
                    self.auth_cookie = response.cookies
                    return {
                        "status": "✅ PASS",
                        "message": "Login successful with provided credentials",
                        "details": f"User: {data.get('user', {}).get('name')}, Expires: {data.get('expiresAt')}"
                    }
            elif response.status_code == 401:
                return {
                    "status": "❌ FAIL",
                    "message": "Login failed - invalid credentials or user not found",
                    "details": response.json().get("detail", "No details")
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"Unexpected login response: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test login endpoint",
                "details": str(e)
            }
    
    def test_ai_page_generator(self) -> Dict[str, Any]:
        """Test POST /api/ai/page-generator with Gemini integration"""
        print("🧪 Testing POST /api/ai/page-generator (Gemini AI)")
        
        if not self.auth_cookie:
            return {
                "status": "❌ SKIP",
                "message": "Skipping AI test - authentication required but login failed"
            }
        
        ai_payload = {
            "prompt": "Créer une page de test simple pour tourisme"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/ai/page-generator",
                json=ai_payload,
                headers={"Content-Type": "application/json"},
                cookies=self.auth_cookie
            )
            
            if response.status_code == 200:
                data = response.json()
                if "sessionId" in data and "generatedPage" in data:
                    return {
                        "status": "✅ PASS",
                        "message": "AI page generation working with Gemini API",
                        "details": f"Session ID: {data['sessionId']}, Page generated: {data['generatedPage'].get('title', 'No title')}"
                    }
                else:
                    return {
                        "status": "❌ FAIL",
                        "message": "AI endpoint returned unexpected response format",
                        "details": f"Response keys: {list(data.keys())}"
                    }
            elif response.status_code == 401:
                return {
                    "status": "❌ FAIL",
                    "message": "AI endpoint requires authentication",
                    "details": "User needs editor permissions"
                }
            elif response.status_code == 403:
                return {
                    "status": "❌ FAIL", 
                    "message": "User lacks required permissions for AI generation",
                    "details": response.json().get("detail", "Insufficient permissions")
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"AI endpoint error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test AI endpoint",
                "details": str(e)
            }
    
    def test_ai_multi_turn_conversation(self) -> Dict[str, Any]:
        """Test multi-turn conversation with same sessionId"""
        print("🧪 Testing Multi-turn AI Conversation")
        
        if not self.auth_cookie:
            return {
                "status": "❌ SKIP",
                "message": "Skipping multi-turn test - authentication required"
            }
        
        # First call to create a session
        first_payload = {
            "prompt": "Créer une page sur le tourisme parisien"
        }
        
        try:
            # First call
            first_response = self.session.post(
                f"{self.base_url}/api/ai/page-generator",
                json=first_payload,
                headers={"Content-Type": "application/json"},
                cookies=self.auth_cookie
            )
            
            if first_response.status_code != 200:
                return {
                    "status": "❌ FAIL",
                    "message": "First AI call failed",
                    "details": f"Status: {first_response.status_code}, Response: {first_response.text}"
                }
            
            first_data = first_response.json()
            session_id = first_data.get("sessionId")
            
            if not session_id:
                return {
                    "status": "❌ FAIL",
                    "message": "First AI call didn't return sessionId",
                    "details": f"Response: {first_data}"
                }
            
            # Second call with same sessionId
            second_payload = {
                "prompt": "Maintenant ajouter des informations sur les monuments historiques",
                "sessionId": session_id  # Same session ID from first call
            }
            
            second_response = self.session.post(
                f"{self.base_url}/api/ai/page-generator", 
                json=second_payload,
                headers={"Content-Type": "application/json"},
                cookies=self.auth_cookie
            )
            
            if second_response.status_code == 200:
                second_data = second_response.json()
                
                # Verify sessionId is same and messages array has grown
                if second_data.get("sessionId") == session_id:
                    first_msg_count = len(first_data.get("messages", []))
                    second_msg_count = len(second_data.get("messages", []))
                    
                    if second_msg_count > first_msg_count:
                        return {
                            "status": "✅ PASS",
                            "message": "Multi-turn conversation working",
                            "details": f"Session {session_id}: Messages grew from {first_msg_count} to {second_msg_count}"
                        }
                    else:
                        return {
                            "status": "❌ FAIL",
                            "message": "Multi-turn conversation not preserving message history",
                            "details": f"Messages count didn't increase: {first_msg_count} to {second_msg_count}"
                        }
                else:
                    return {
                        "status": "❌ FAIL",
                        "message": "SessionId not preserved in multi-turn conversation",
                        "details": f"First: {session_id}, Second: {second_data.get('sessionId')}"
                    }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": "Second AI call failed in multi-turn conversation",
                    "details": f"Status: {second_response.status_code}, Response: {second_response.text}"
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test multi-turn conversation",
                "details": str(e)
            }
    
    def test_sitemap_xml(self) -> Dict[str, Any]:
        """Test GET /sitemap.xml returns valid XML"""
        print("🧪 Testing GET /sitemap.xml")
        
        try:
            response = self.session.get(f"{self.base_url}/sitemap.xml")
            
            if response.status_code == 200:
                content_type = response.headers.get("content-type", "")
                if "xml" in content_type.lower():
                    # Try to parse as XML
                    try:
                        ET.fromstring(response.text)
                        return {
                            "status": "✅ PASS",
                            "message": "Sitemap XML is valid",
                            "details": f"Content-Type: {content_type}, Size: {len(response.text)} chars"
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
    
    def test_menu_authenticated(self) -> Dict[str, Any]:
        """Test GET /api/menu after authentication"""
        print("🧪 Testing GET /api/menu (Authenticated)")
        
        if not self.auth_cookie:
            return {
                "status": "❌ SKIP",
                "message": "Skipping menu test - authentication required but login failed"
            }
        
        try:
            response = self.session.get(
                f"{self.base_url}/api/menu",
                cookies=self.auth_cookie
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, (list, dict)):
                    return {
                        "status": "✅ PASS",
                        "message": "Menu endpoint working after authentication",
                        "details": f"Menu data type: {type(data).__name__}, Size: {len(str(data))} chars"
                    }
            elif response.status_code == 401:
                return {
                    "status": "❌ FAIL",
                    "message": "Menu endpoint requires authentication",
                    "details": "Authentication cookie may have expired"
                }
            elif response.status_code == 403:
                return {
                    "status": "❌ FAIL",
                    "message": "User lacks permissions for menu endpoint", 
                    "details": response.json().get("detail", "Insufficient permissions")
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"Menu endpoint error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test menu endpoint",
                "details": str(e)
            }

    def test_admin_pages_unauthenticated(self) -> Dict[str, Any]:
        """Test GET /admin/pages without session - should redirect to /admin/login with redirect parameter"""
        print("🔒 Testing GET /admin/pages (Unauthenticated - Security Test)")
        
        # Create a new session without auth cookies
        unauthenticated_session = requests.Session()
        
        try:
            response = unauthenticated_session.get(
                f"{self.base_url}/admin/pages",
                allow_redirects=False  # Don't follow redirects to see the actual response
            )
            
            if response.status_code == 307:
                location = response.headers.get("Location", "")
                if "/admin/login" in location and "redirect=" in location:
                    return {
                        "status": "✅ PASS",
                        "message": "Admin pages properly protected - redirects to login with redirect parameter",
                        "details": f"Status: 307, Location: {location}"
                    }
                elif "/admin/login" in location:
                    return {
                        "status": "⚠️ WARNING", 
                        "message": "Admin pages redirect to login but missing redirect parameter",
                        "details": f"Status: 307, Location: {location}"
                    }
                else:
                    return {
                        "status": "❌ FAIL",
                        "message": "Admin pages redirect to unexpected location", 
                        "details": f"Status: 307, Location: {location}"
                    }
            elif response.status_code == 302:
                location = response.headers.get("Location", "")
                if "/admin/login" in location:
                    return {
                        "status": "✅ PASS",
                        "message": "Admin pages protected with 302 redirect to login",
                        "details": f"Status: 302, Location: {location}"
                    }
                else:
                    return {
                        "status": "❌ FAIL",
                        "message": "Admin pages redirect to unexpected location",
                        "details": f"Status: 302, Location: {location}"
                    }
            elif response.status_code == 401:
                return {
                    "status": "✅ PASS",
                    "message": "Admin pages properly protected with 401 Unauthorized",
                    "details": f"Status: 401, Response: {response.text[:200]}"
                }
            elif response.status_code == 403:
                return {
                    "status": "✅ PASS", 
                    "message": "Admin pages properly protected with 403 Forbidden",
                    "details": f"Status: 403, Response: {response.text[:200]}"
                }
            elif response.status_code == 200:
                return {
                    "status": "❌ CRITICAL SECURITY ISSUE",
                    "message": "Admin pages accessible without authentication! This is a security vulnerability.",
                    "details": f"Status: 200, Content length: {len(response.text)}"
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"Unexpected response from admin pages: {response.status_code}",
                    "details": response.text[:200]
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test admin pages protection",
                "details": str(e)
            }

    def test_menu_unauthenticated(self) -> Dict[str, Any]:
        """Test GET /api/menu without session - should return 401/403, not 200"""
        print("🔒 Testing GET /api/menu (Unauthenticated - Security Test)")
        
        # Create a new session without auth cookies
        unauthenticated_session = requests.Session()
        
        try:
            response = unauthenticated_session.get(f"{self.base_url}/api/menu")
            
            if response.status_code == 401:
                return {
                    "status": "✅ PASS",
                    "message": "Menu endpoint properly protected with 401 Unauthorized",
                    "details": f"Response: {response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:100]}"
                }
            elif response.status_code == 403:
                return {
                    "status": "✅ PASS",
                    "message": "Menu endpoint properly protected with 403 Forbidden", 
                    "details": f"Response: {response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:100]}"
                }
            elif response.status_code == 200:
                return {
                    "status": "❌ CRITICAL SECURITY ISSUE",
                    "message": "Menu endpoint accessible without authentication! This is a security vulnerability.",
                    "details": f"Status: 200, Response: {response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200]}"
                }
            else:
                return {
                    "status": "❌ UNEXPECTED",
                    "message": f"Unexpected response from menu endpoint: {response.status_code}",
                    "details": response.text[:200]
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR", 
                "message": "Failed to test menu endpoint protection",
                "details": str(e)
            }

    def test_contact_send_regression(self) -> Dict[str, Any]:
        """Test POST /api/contact/send regression test - ensure no regression from security fix"""
        print("🧪 Testing POST /api/contact/send (Regression Test)")
        
        payload = {
            "name": "Marie Dubois",
            "email": "marie.dubois@example.com",
            "subject": "Demande d'information visite de groupe",
            "message": "Bonjour, je souhaiterais organiser une visite de groupe pour 15 personnes. Pouvez-vous me donner plus d'informations sur vos disponibilités et tarifs ? Merci."
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/contact/send",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "✅ PASS",
                    "message": "Contact form regression test passed - no issues from security fix",
                    "details": f"Response: {data.get('message', 'No message in response')}"
                }
            elif response.status_code == 429:
                data = response.json()
                return {
                    "status": "✅ PASS", 
                    "message": "Contact form working correctly - rate limited (this is expected)",
                    "details": f"Rate limit response: {data.get('detail', data.get('message', 'No details'))}"
                }
            elif response.status_code == 400:
                data = response.json()
                return {
                    "status": "❌ FAIL",
                    "message": "Contact form validation error - possible regression",
                    "details": f"Validation error: {data.get('detail', data.get('message', response.text))}"
                }
            elif response.status_code == 500:
                return {
                    "status": "❌ FAIL",
                    "message": "Contact form internal server error - possible regression from security fix",
                    "details": f"Server error: {response.text[:200]}"
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"Unexpected response from contact form: {response.status_code}",
                    "details": response.text[:200]
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test contact form regression",
                "details": str(e)
            }

    def run_all_tests(self):
        """Run all backend tests with focus on security regression testing"""
        print("🚀 Starting Greeters Next.js Backend Security Regression Tests")
        print("🔒 POST-ADMIN SECURITY FIX VERIFICATION")
        print("=" * 60)
        
        test_results = []
        
        # SECURITY TEST 1: Admin pages protection (unauthenticated)
        result = self.test_admin_pages_unauthenticated()
        test_results.append(("GET /admin/pages (Unauthenticated)", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # SECURITY TEST 2: Menu API protection (unauthenticated)
        result = self.test_menu_unauthenticated()
        test_results.append(("GET /api/menu (Unauthenticated)", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # TEST 3: Authentication (required for subsequent tests)
        result = self.test_auth_login()
        test_results.append(("POST /api/auth/login", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # TEST 4: Menu API after authentication (should work)
        result = self.test_menu_authenticated()
        test_results.append(("GET /api/menu (Authenticated)", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # REGRESSION TEST 5: Contact form (ensure no regression from security fix)
        result = self.test_contact_send_regression()
        test_results.append(("POST /api/contact/send (Regression Test)", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # ADDITIONAL TESTS (lower priority)
        print("📋 Additional API Tests:")
        print("-" * 30)
        
        # Test: Contact form validation  
        result = self.test_contact_invalid_payload()
        test_results.append(("POST /api/contact/send (Invalid Payload)", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Test: AI Page Generator
        result = self.test_ai_page_generator()
        test_results.append(("POST /api/ai/page-generator", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Test: Multi-turn AI conversation
        result = self.test_ai_multi_turn_conversation()
        test_results.append(("Multi-turn AI Conversation", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Test: Sitemap XML
        result = self.test_sitemap_xml()
        test_results.append(("GET /sitemap.xml", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Summary
        print("=" * 60)
        print("📊 SECURITY REGRESSION TEST SUMMARY")
        print("=" * 60)
        
        passed = 0
        failed = 0
        errors = 0
        warnings = 0
        skipped = 0
        security_issues = 0
        
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
            elif "CRITICAL SECURITY ISSUE" in status:
                security_issues += 1
                failed += 1
            
            print(f"{status} {test_name}")
        
        print()
        print(f"📈 Results: {passed} passed, {failed} failed, {errors} errors, {warnings} warnings, {skipped} skipped")
        
        if security_issues > 0:
            print(f"🔥 CRITICAL: {security_issues} security vulnerabilities found!")
            print("❌ Admin protection vulnerability is NOT FIXED")
            return False
        elif failed > 0 or errors > 0:
            print("❌ Some tests failed - check details above")
            return False
        elif warnings > 0:
            print("⚠️  Tests completed with warnings - review needed")
            print("✅ Admin protection appears to be working with minor issues")
            return True
        else:
            print("✅ All security tests passed!")
            print("✅ Admin protection vulnerability is FIXED")
            return True

if __name__ == "__main__":
    tester = GreetersTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
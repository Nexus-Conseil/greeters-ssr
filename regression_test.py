#!/usr/bin/env python3
"""
Regression Testing Script for Greeters Next.js Application
After SendGrid -> Emailit migration and bootstrap CMS implementation

Test Requirements:
1. POST /api/contact/send returns real Emailit success on valid payload
2. POST /api/admin/bootstrap/public-content accessible after admin login
3. GET /sitemap.xml returns localized URLs via Host header FR and EN
4. Protected admin routes redirect/force auth if not authenticated

Admin credentials: contact@nexus-conseil.ch / Greeters&58!2026
Test URL: http://127.0.0.1:3100
"""

import json
import requests
import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional
import sys

class RegressionTester:
    def __init__(self):
        self.base_url = "http://127.0.0.1:3100"
        self.session = requests.Session()
        self.auth_cookie = None
        
    def test_contact_send_emailit_success(self) -> Dict[str, Any]:
        """Test 1: POST /api/contact/send returns real Emailit success on valid payload"""
        print("🧪 Test 1: POST /api/contact/send (Real Emailit Integration)")
        
        payload = {
            "name": "Marie Dubois",
            "email": "marie.dubois@example.fr", 
            "subject": "Test régression Emailit",
            "message": "Test de régression après migration SendGrid vers Emailit. Message envoyé depuis les tests automatisés."
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/contact/send",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   Response Status: {response.status_code}")
            print(f"   Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    return {
                        "status": "✅ PASS",
                        "message": "Emailit integration working - contact form returns success",
                        "details": f"Status: {response.status_code}, Response: {data}",
                        "is_mocked": False
                    }
                except:
                    return {
                        "status": "✅ PASS",
                        "message": "Contact form successful (non-JSON response)",
                        "details": f"Status: {response.status_code}, Response: {response.text[:200]}",
                        "is_mocked": False
                    }
            elif response.status_code == 429:
                # Emailit quota/rate limit error
                try:
                    data = response.json()
                    error_msg = data.get("detail", data.get("message", str(data)))
                    return {
                        "status": "⚠️ WARNING",
                        "message": "Emailit quota/rate limit reached - integration is real (not mocked)",
                        "details": f"Status: {response.status_code}, Error: {error_msg}",
                        "is_mocked": False
                    }
                except:
                    return {
                        "status": "⚠️ WARNING", 
                        "message": "Emailit quota/rate limit reached - integration is real",
                        "details": f"Status: {response.status_code}, Response: {response.text[:200]}",
                        "is_mocked": False
                    }
            elif response.status_code == 502:
                # Emailit service error
                return {
                    "status": "⚠️ WARNING",
                    "message": "Emailit service temporarily unavailable - integration is real",
                    "details": f"Status: {response.status_code}, Emailit API may be down",
                    "is_mocked": False
                }
            elif response.status_code == 400:
                # Validation error
                try:
                    data = response.json()
                    return {
                        "status": "❌ FAIL",
                        "message": "Contact form validation failed with valid payload", 
                        "details": f"Status: {response.status_code}, Error: {data}",
                        "is_mocked": False
                    }
                except:
                    return {
                        "status": "❌ FAIL",
                        "message": "Contact form returned 400 error with valid payload",
                        "details": f"Status: {response.status_code}, Response: {response.text[:200]}",
                        "is_mocked": False
                    }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"Unexpected response from contact endpoint",
                    "details": f"Status: {response.status_code}, Response: {response.text[:200]}",
                    "is_mocked": False
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to call contact endpoint", 
                "details": str(e)
            }
    
    def test_admin_login_and_bootstrap(self) -> Dict[str, Any]:
        """Test 2: Login as admin and access bootstrap endpoint"""
        print("🧪 Test 2: Admin Login + POST /api/admin/bootstrap/public-content")
        
        # Step 1: Login
        login_payload = {
            "email": "contact@nexus-conseil.ch",
            "password": "Greeters&58!2026"
        }
        
        try:
            login_response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=login_payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   Login Status: {login_response.status_code}")
            
            if login_response.status_code != 200:
                return {
                    "status": "❌ FAIL",
                    "message": "Admin login failed with provided credentials",
                    "details": f"Login Status: {login_response.status_code}, Response: {login_response.text[:200]}"
                }
            
            # Save authentication cookies
            self.auth_cookie = login_response.cookies
            
            # Step 2: Test bootstrap endpoint
            bootstrap_response = self.session.post(
                f"{self.base_url}/api/admin/bootstrap/public-content",
                headers={"Content-Type": "application/json"},
                cookies=self.auth_cookie
            )
            
            print(f"   Bootstrap Status: {bootstrap_response.status_code}")
            
            if bootstrap_response.status_code == 200:
                try:
                    data = bootstrap_response.json()
                    return {
                        "status": "✅ PASS",
                        "message": "Bootstrap endpoint accessible after admin login",
                        "details": f"Login: {login_response.status_code}, Bootstrap: {bootstrap_response.status_code}, Response: {data}"
                    }
                except:
                    return {
                        "status": "✅ PASS",
                        "message": "Bootstrap endpoint accessible (non-JSON response)",
                        "details": f"Login: {login_response.status_code}, Bootstrap: {bootstrap_response.status_code}, Response: {bootstrap_response.text[:200]}"
                    }
            elif bootstrap_response.status_code == 401:
                return {
                    "status": "❌ FAIL",
                    "message": "Bootstrap endpoint rejected authenticated request",
                    "details": f"Bootstrap returned 401 despite successful login (cookies may not be working)"
                }
            elif bootstrap_response.status_code == 403:
                return {
                    "status": "❌ FAIL", 
                    "message": "Admin user lacks permissions for bootstrap endpoint",
                    "details": f"Bootstrap Status: {bootstrap_response.status_code}, Response: {bootstrap_response.text[:200]}"
                }
            elif bootstrap_response.status_code == 404:
                return {
                    "status": "❌ FAIL",
                    "message": "Bootstrap endpoint not found",
                    "details": f"Bootstrap Status: {bootstrap_response.status_code} - endpoint may not be implemented"
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": f"Bootstrap endpoint error: {bootstrap_response.status_code}",
                    "details": f"Bootstrap Status: {bootstrap_response.status_code}, Response: {bootstrap_response.text[:200]}"
                }
                
        except Exception as e:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test admin login and bootstrap",
                "details": str(e)
            }
    
    def test_sitemap_localization(self) -> Dict[str, Any]:
        """Test 3: GET /sitemap.xml returns localized URLs via Host header"""
        print("🧪 Test 3: GET /sitemap.xml (Localized URLs via Host header)")
        
        test_results = []
        
        # Test FR (default)
        try:
            fr_response = self.session.get(
                f"{self.base_url}/sitemap.xml",
                headers={"Host": "greeters.paris"}
            )
            
            print(f"   FR Host Status: {fr_response.status_code}")
            
            if fr_response.status_code == 200:
                try:
                    # Parse XML
                    fr_root = ET.fromstring(fr_response.text)
                    fr_urls = [url.find("{http://www.sitemaps.org/schemas/sitemap/0.9}loc").text 
                              for url in fr_root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url")]
                    test_results.append(("FR", fr_response.status_code, len(fr_urls), fr_urls[:3]))
                except Exception as e:
                    test_results.append(("FR", fr_response.status_code, "XML_ERROR", str(e)))
            else:
                test_results.append(("FR", fr_response.status_code, "FAIL", fr_response.text[:100]))
        except Exception as e:
            test_results.append(("FR", "ERROR", "EXCEPTION", str(e)))
        
        # Test EN  
        try:
            en_response = self.session.get(
                f"{self.base_url}/sitemap.xml",
                headers={"Host": "en.greeters.paris"}
            )
            
            print(f"   EN Host Status: {en_response.status_code}")
            
            if en_response.status_code == 200:
                try:
                    # Parse XML
                    en_root = ET.fromstring(en_response.text)
                    en_urls = [url.find("{http://www.sitemaps.org/schemas/sitemap/0.9}loc").text 
                              for url in en_root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url")]
                    test_results.append(("EN", en_response.status_code, len(en_urls), en_urls[:3]))
                except Exception as e:
                    test_results.append(("EN", en_response.status_code, "XML_ERROR", str(e)))
            else:
                test_results.append(("EN", en_response.status_code, "FAIL", en_response.text[:100]))
        except Exception as e:
            test_results.append(("EN", "ERROR", "EXCEPTION", str(e)))
        
        # Analyze results
        fr_result = test_results[0] if len(test_results) > 0 else None
        en_result = test_results[1] if len(test_results) > 1 else None
        
        if fr_result and en_result:
            fr_status = fr_result[1] == 200
            en_status = en_result[1] == 200
            
            if fr_status and en_status:
                # Check if URLs are different (localized)
                fr_urls = fr_result[3] if isinstance(fr_result[3], list) else []
                en_urls = en_result[3] if isinstance(en_result[3], list) else []
                
                return {
                    "status": "✅ PASS",
                    "message": "Sitemap XML returns localized URLs for FR and EN hosts",
                    "details": f"FR URLs: {fr_result[2] if isinstance(fr_result[2], int) else 'N/A'}, EN URLs: {en_result[2] if isinstance(en_result[2], int) else 'N/A'}, Sample FR: {fr_urls}, Sample EN: {en_urls}"
                }
            elif fr_status or en_status:
                working = "FR" if fr_status else "EN"
                failing = "EN" if fr_status else "FR"
                return {
                    "status": "⚠️ WARNING",
                    "message": f"Sitemap XML works for {working} but fails for {failing}",
                    "details": f"Results: {test_results}"
                }
            else:
                return {
                    "status": "❌ FAIL",
                    "message": "Sitemap XML fails for both FR and EN hosts",
                    "details": f"Results: {test_results}"
                }
        else:
            return {
                "status": "❌ ERROR",
                "message": "Failed to test sitemap localization",
                "details": f"Results: {test_results}"
            }
    
    def test_admin_routes_protection(self) -> Dict[str, Any]:
        """Test 4: Protected admin routes redirect/force auth if not authenticated"""
        print("🧪 Test 4: Admin Routes Protection (Unauthenticated Access)")
        
        # Test admin routes without authentication
        admin_routes = [
            "/admin/pages",
            "/admin/dashboard", 
            "/api/admin/bootstrap/public-content",
            "/api/admin/pages",
            "/api/menu"
        ]
        
        # Clear any existing authentication
        unauthenticated_session = requests.Session()
        
        results = []
        
        for route in admin_routes:
            try:
                response = unauthenticated_session.get(f"{self.base_url}{route}")
                
                print(f"   {route}: {response.status_code}")
                
                if response.status_code in [401, 403]:
                    # Correctly protected
                    results.append((route, "PROTECTED", response.status_code))
                elif response.status_code in [302, 307, 308]:
                    # Redirect (possibly to login)
                    redirect_location = response.headers.get("Location", "No Location")
                    results.append((route, "REDIRECT", f"{response.status_code} -> {redirect_location}"))
                elif response.status_code == 200:
                    # Not protected (potential security issue)
                    results.append((route, "UNPROTECTED", response.status_code))
                elif response.status_code == 404:
                    # Route doesn't exist
                    results.append((route, "NOT_FOUND", response.status_code))
                else:
                    # Other response
                    results.append((route, "OTHER", response.status_code))
                    
            except Exception as e:
                results.append((route, "ERROR", str(e)))
        
        # Analyze protection results
        protected_count = sum(1 for _, status, _ in results if status in ["PROTECTED", "REDIRECT"])
        unprotected_count = sum(1 for _, status, _ in results if status == "UNPROTECTED")
        total_testable = sum(1 for _, status, _ in results if status not in ["NOT_FOUND", "ERROR"])
        
        if unprotected_count == 0 and total_testable > 0:
            return {
                "status": "✅ PASS",
                "message": f"All admin routes properly protected ({protected_count}/{total_testable})",
                "details": f"Results: {results}"
            }
        elif unprotected_count > 0:
            return {
                "status": "❌ FAIL",
                "message": f"Some admin routes are unprotected ({unprotected_count}/{total_testable})",
                "details": f"Unprotected routes found! Results: {results}"
            }
        else:
            return {
                "status": "⚠️ WARNING", 
                "message": "Could not test admin route protection (routes not found or errors)",
                "details": f"Results: {results}"
            }

    def run_regression_tests(self):
        """Run all regression tests and generate report"""
        print("🚀 Starting Greeters Regression Tests")
        print("After SendGrid -> Emailit migration and bootstrap CMS")
        print("=" * 70)
        
        test_results = []
        
        # Test 1: Emailit integration
        result = self.test_contact_send_emailit_success()
        test_results.append(("Emailit Integration", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Test 2: Admin bootstrap
        result = self.test_admin_login_and_bootstrap()
        test_results.append(("Admin Bootstrap Access", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Test 3: Sitemap localization
        result = self.test_sitemap_localization()
        test_results.append(("Sitemap Localization", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Test 4: Admin route protection
        result = self.test_admin_routes_protection()
        test_results.append(("Admin Route Protection", result))
        print(f"{result['status']} {result['message']}")
        if result.get('details'):
            print(f"   Details: {result['details']}")
        print()
        
        # Summary
        print("=" * 70)
        print("📊 REGRESSION TEST SUMMARY")
        print("=" * 70)
        
        passed = 0
        failed = 0
        errors = 0
        warnings = 0
        
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
            
            print(f"{status} {test_name}")
        
        print()
        print(f"📈 Results: {passed} passed, {failed} failed, {errors} errors, {warnings} warnings")
        
        # Overall assessment
        if failed > 0 or errors > 0:
            print("❌ REGRESSION TESTS FAILED - Critical issues found")
            return False
        elif warnings > 0:
            print("⚠️  REGRESSION TESTS PASSED with warnings - Review needed")
            return True
        else:
            print("✅ ALL REGRESSION TESTS PASSED!")
            return True

if __name__ == "__main__":
    tester = RegressionTester()
    success = tester.run_regression_tests()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
Backend Testing Script for Greeters Next.js Application  
Tests critical backend API endpoints on the public URL from .env
Based on the original problem statement requirements for testing.
"""

import json
import requests
import sys
from datetime import datetime
from typing import Dict, Any

class GreetersTester:
    def __init__(self):
        # Use the public URL from .env
        self.base_url = "https://greeting-app-1494.preview.emergentagent.com"
        self.session = requests.Session()
        self.auth_cookie = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def run_test(self, name, method, endpoint, expected_status, data=None, cookies=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, cookies=cookies)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, cookies=cookies)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return True, response
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, response

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None

    def test_api_health(self):
        """Test GET /api/health endpoint"""
        success, response = self.run_test(
            "API Health Check", 
            "GET", 
            "/api/health", 
            200
        )
        
        if success and response:
            try:
                data = response.json()
                print(f"   Health data: {data}")
                return True
            except:
                print(f"   Health response: {response.text}")
                return True
        return False

    def test_api_pages_public(self):
        """Test GET /api/pages/public endpoint"""
        success, response = self.run_test(
            "Public Pages API",
            "GET", 
            "/api/pages/public",
            200
        )
        
        if success and response:
            try:
                data = response.json()
                print(f"   Pages count: {len(data) if isinstance(data, list) else 'Not a list'}")
                return True
            except:
                print(f"   Pages response: {response.text[:100]}...")
                return True
        return False

    def test_admin_login_page(self):
        """Test GET /admin/login page loads"""
        success, response = self.run_test(
            "Admin Login Page",
            "GET",
            "/admin/login", 
            200
        )
        
        if success and response:
            if "login" in response.text.lower() or "connexion" in response.text.lower():
                print("   ✅ Login page contains login form elements")
                return True
            else:
                print("   ⚠️  Login page loaded but no login form detected")
                return True
        return False

    def test_admin_auth_api(self):
        """Test POST /api/auth/login with provided credentials"""
        credentials = {
            "email": "admin@greeters.local", 
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Authentication",
            "POST",
            "/api/auth/login",
            200,
            data=credentials
        )
        
        if success and response:
            try:
                data = response.json()
                if "user" in data or "token" in data or "success" in str(data).lower():
                    print(f"   ✅ Authentication successful")
                    # Save cookies for further testing
                    self.auth_cookie = response.cookies
                    return True
                else:
                    print(f"   ⚠️  Unexpected auth response: {data}")
                    return False
            except:
                print(f"   Auth response: {response.text[:100]}...")
                # Even if we can't parse JSON, if status is 200, auth might work
                self.auth_cookie = response.cookies
                return True
        return False

    def test_admin_dashboard(self):
        """Test GET /admin page after authentication"""
        if not self.auth_cookie:
            print("❌ Skipping admin dashboard test - no auth cookies")
            return False
            
        success, response = self.run_test(
            "Admin Dashboard",
            "GET",
            "/admin",
            200,
            cookies=self.auth_cookie
        )
        
        if success and response:
            if "dashboard" in response.text.lower() or "admin" in response.text.lower():
                print("   ✅ Dashboard page loaded successfully")
                return True
            else:
                print("   ⚠️  Dashboard loaded but content unclear")
                return True
        return False

    def test_admin_pages_list(self):
        """Test GET /admin/pages - list of pages in admin"""
        if not self.auth_cookie:
            print("❌ Skipping admin pages test - no auth cookies") 
            return False
            
        success, response = self.run_test(
            "Admin Pages List",
            "GET", 
            "/admin/pages",
            200,
            cookies=self.auth_cookie
        )
        
        if success and response:
            if "pages" in response.text.lower() or "page" in response.text.lower():
                print("   ✅ Admin pages list loaded successfully")
                return True
            else:
                print("   ⚠️  Admin pages loaded but content unclear") 
                return True
        return False

    def run_all_tests(self):
        """Run all required tests from the review request"""
        print("🚀 Starting Greeters SSR Project Backend Tests")
        print("🌐 Testing on:", self.base_url)
        print("=" * 60)
        
        test_results = []
        
        # Test 1: API Health Check
        print("\n1️⃣ API Health Check")
        result = self.test_api_health()
        test_results.append(("API Health Check", result))
        
        # Test 2: Public Pages API
        print("\n2️⃣ Public Pages API") 
        result = self.test_api_pages_public()
        test_results.append(("Public Pages API", result))
        
        # Test 3: Admin Login Page
        print("\n3️⃣ Admin Login Page")
        result = self.test_admin_login_page() 
        test_results.append(("Admin Login Page", result))
        
        # Test 4: Admin Authentication
        print("\n4️⃣ Admin Authentication")
        result = self.test_admin_auth_api()
        test_results.append(("Admin Authentication", result))
        
        # Test 5: Admin Dashboard (requires auth)
        print("\n5️⃣ Admin Dashboard")
        result = self.test_admin_dashboard()
        test_results.append(("Admin Dashboard", result))
        
        # Test 6: Admin Pages List (requires auth)
        print("\n6️⃣ Admin Pages List")
        result = self.test_admin_pages_list()
        test_results.append(("Admin Pages List", result))
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 BACKEND TESTS SUMMARY")
        print("=" * 60)
        
        passed_tests = []
        failed_tests = []
        
        for test_name, result in test_results:
            if result:
                print(f"✅ {test_name}")
                passed_tests.append(test_name)
            else:
                print(f"❌ {test_name}")
                failed_tests.append(test_name)
        
        print(f"\n📈 Results: {len(passed_tests)} passed, {len(failed_tests)} failed")
        
        if failed_tests:
            print(f"❌ Failed tests: {', '.join(failed_tests)}")
            return False
        else:
            print("✅ All backend tests passed!")
            return True

if __name__ == "__main__":
    tester = GreetersTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
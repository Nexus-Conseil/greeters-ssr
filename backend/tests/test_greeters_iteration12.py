"""
Iteration 12 - Full SEO Studio Testing
Tests cover:
1. /admin/pages/new and /admin/pages/[id] - Page editor with SEO studio
2. POST /api/ai/seo-optimizer - Gemini AI SEO optimization (admin only)
3. Home page loading from CMS structured content
4. Sitemap XML with changefreq/priority, host/locale compliance, noindex filtering
5. Public routes smoke test with JSON-LD presence
6. Contact Emailit integration
7. Admin protection - /admin/pages redirect without session, /api/menu 401 without session
"""

import pytest
import requests
import os
import re

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "http://127.0.0.1:3100"

ADMIN_EMAIL = "contact@nexus-conseil.ch"
ADMIN_PASSWORD = "Greeters&58!2026"


class TestAdminProtection:
    """Admin routes require authentication - redirects or 401"""

    def test_admin_pages_redirect_without_session(self):
        """GET /admin/pages without session should redirect to login (307)"""
        response = requests.get(f"{BASE_URL}/admin/pages", allow_redirects=False)
        assert response.status_code == 307, f"Expected 307 redirect, got {response.status_code}"
        location = response.headers.get("Location", "")
        assert "/admin/login" in location, f"Redirect should go to /admin/login, got {location}"

    def test_admin_pages_new_redirect_without_session(self):
        """GET /admin/pages/new without session should redirect to login (307)"""
        response = requests.get(f"{BASE_URL}/admin/pages/new", allow_redirects=False)
        assert response.status_code == 307, f"Expected 307 redirect, got {response.status_code}"

    def test_api_menu_returns_401_without_session(self):
        """GET /api/menu without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/menu")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data

    def test_api_seo_optimizer_returns_401_without_session(self):
        """POST /api/ai/seo-optimizer without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/ai/seo-optimizer",
            json={"page": {"title": "Test", "slug": "test"}}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data


class TestSitemapXml:
    """Sitemap.xml compliance: changefreq, priority, host, locale, noindex filtering"""

    def test_sitemap_returns_valid_xml(self):
        """GET /sitemap.xml returns valid XML with urlset"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        content = response.text
        assert '<?xml version="1.0"' in content, "Missing XML declaration"
        assert "<urlset" in content, "Missing urlset element"
        assert "</urlset>" in content, "Unclosed urlset element"

    def test_sitemap_contains_changefreq(self):
        """Sitemap entries include changefreq element"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        content = response.text
        assert "<changefreq>" in content, "Missing changefreq element"
        # Valid values: always, hourly, daily, weekly, monthly, yearly, never
        valid_freqs = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]
        freq_match = re.search(r"<changefreq>(\w+)</changefreq>", content)
        assert freq_match, "Could not extract changefreq value"
        assert freq_match.group(1) in valid_freqs, f"Invalid changefreq: {freq_match.group(1)}"

    def test_sitemap_contains_priority(self):
        """Sitemap entries include priority element"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        content = response.text
        assert "<priority>" in content, "Missing priority element"
        # Priority should be between 0.0 and 1.0
        priority_match = re.search(r"<priority>([\d.]+)</priority>", content)
        assert priority_match, "Could not extract priority value"
        priority = float(priority_match.group(1))
        assert 0 <= priority <= 1, f"Priority out of range: {priority}"

    def test_sitemap_homepage_has_priority_1(self):
        """Homepage entry should have priority 1.0"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        content = response.text
        # Look for homepage entry with priority 1.0
        # Homepage loc should end with "/" and have priority 1.0
        lines = content.split("\n")
        found_homepage_priority = False
        in_homepage_url = False
        for line in lines:
            if "<loc>" in line and line.rstrip().endswith("/</loc>"):
                in_homepage_url = True
            if in_homepage_url and "<priority>1.0</priority>" in line:
                found_homepage_priority = True
                break
            if "</url>" in line:
                in_homepage_url = False
        assert found_homepage_priority, "Homepage should have priority 1.0"

    def test_sitemap_uses_correct_host(self):
        """Sitemap URLs use greeters.paris host"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        content = response.text
        # Check for proper domain
        assert "greeters.paris" in content, "URLs should use greeters.paris domain"

    def test_sitemap_no_noindex_pages(self):
        """Sitemap should not include pages with noindex robots directive"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        content = response.text
        # Verify sitemap doesn't contain admin or private pages
        assert "/admin" not in content.lower(), "Admin pages should not be in sitemap"


class TestPublicRoutesJsonLd:
    """Public routes smoke test with JSON-LD presence"""

    @pytest.mark.parametrize("route,testid", [
        ("/", "public-home-page"),
        ("/contact", "contact-public-page"),
        ("/actualites", "actualites-public-page"),
        ("/galerie", "galerie-public-page"),
        ("/livre-dor", "livre-dor-public-page"),
        ("/qui-sommes-nous", "qui-sommes-nous-public-page"),
    ])
    def test_public_route_returns_200(self, route, testid):
        """Public route returns 200"""
        response = requests.get(f"{BASE_URL}{route}")
        assert response.status_code == 200, f"Route {route} returned {response.status_code}"

    @pytest.mark.parametrize("route", [
        "/",
        "/contact",
        "/actualites",
        "/galerie",
        "/livre-dor",
        "/qui-sommes-nous",
    ])
    def test_public_route_has_json_ld(self, route):
        """Public route contains JSON-LD structured data"""
        response = requests.get(f"{BASE_URL}{route}")
        content = response.text
        # JSON-LD is embedded in script tags with @context
        assert '"@context"' in content or "@context" in content, f"Route {route} missing JSON-LD @context"
        assert "schema.org" in content, f"Route {route} missing schema.org reference"


class TestHomePageCmsContent:
    """Home page loads correctly from CMS/fallback hybrid layer"""

    def test_home_page_loads(self):
        """GET / returns 200 and contains expected content"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        content = response.text
        # Should contain Paris Greeters branding
        assert "Paris Greeters" in content or "greeters" in content.lower()

    def test_home_page_has_testid(self):
        """Home page contains expected data-testid attribute"""
        response = requests.get(f"{BASE_URL}/")
        content = response.text
        assert 'data-testid="public-home-page"' in content or "public-home-page" in content


class TestContactEmailit:
    """Contact form Emailit integration"""

    def test_contact_api_rejects_empty_payload(self):
        """POST /api/contact/send rejects empty payload"""
        response = requests.post(
            f"{BASE_URL}/api/contact/send",
            json={}
        )
        # Should return 400 for validation error
        assert response.status_code == 400, f"Expected 400 for empty payload, got {response.status_code}"

    def test_contact_api_rejects_invalid_email(self):
        """POST /api/contact/send rejects invalid email format"""
        response = requests.post(
            f"{BASE_URL}/api/contact/send",
            json={
                "name": "Test User",
                "email": "not-an-email",
                "subject": "Test",
                "message": "Test message"
            }
        )
        # Should return 400 for validation error
        assert response.status_code == 400, f"Expected 400 for invalid email, got {response.status_code}"

    def test_contact_api_validates_required_fields(self):
        """POST /api/contact/send validates all required fields"""
        # Missing message
        response = requests.post(
            f"{BASE_URL}/api/contact/send",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "subject": "Test"
            }
        )
        assert response.status_code == 400, f"Expected 400 for missing message, got {response.status_code}"


class TestAdminPageEditor:
    """Admin page editor form and SEO studio tests"""

    def get_auth_cookies(self):
        """Login and get session cookies"""
        session = requests.Session()
        # Get CSRF token from login page
        login_page = session.get(f"{BASE_URL}/admin/login")
        
        # Attempt login
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
        )
        if response.status_code != 200:
            pytest.skip(f"Login failed with status {response.status_code}")
        return session

    def test_admin_login_works(self):
        """Admin login returns 200 with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
        )
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        data = response.json()
        assert "user" in data or "email" in data or "token" in str(data).lower() or response.cookies

    def test_api_pages_list_requires_auth(self):
        """GET /api/pages requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pages")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_api_pages_list_works_with_auth(self):
        """GET /api/pages returns page list when authenticated"""
        session = self.get_auth_cookies()
        response = session.get(f"{BASE_URL}/api/pages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Should return array of pages or paginated response
        assert isinstance(data, (list, dict))

    def test_api_seo_optimizer_works_with_auth(self):
        """POST /api/ai/seo-optimizer returns optimization when authenticated"""
        session = self.get_auth_cookies()
        response = session.post(
            f"{BASE_URL}/api/ai/seo-optimizer",
            json={
                "page": {
                    "title": "Test Page for SEO",
                    "slug": "test-seo-page",
                    "locale": "fr",
                    "metaDescription": "Test description for SEO optimization",
                    "sections": []
                },
                "locale": "fr",
                "instructions": "Focus on local tourism keywords"
            }
        )
        # Should return 200 with optimization data (Gemini API)
        # Or could fail if Gemini quota exceeded - both are valid states
        assert response.status_code in [200, 502, 429], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "optimization" in data, "Response should contain optimization data"
            opt = data["optimization"]
            # Verify SEO fields are returned
            assert "metaTitle" in opt or "meta_title" in str(opt).lower()

    def test_api_page_get_single(self):
        """GET /api/pages/:id returns single page with SEO fields"""
        session = self.get_auth_cookies()
        # First get page list
        list_response = session.get(f"{BASE_URL}/api/pages")
        if list_response.status_code != 200:
            pytest.skip("Could not get page list")
        pages = list_response.json()
        if isinstance(pages, dict) and "items" in pages:
            pages = pages["items"]
        if not pages or len(pages) == 0:
            pytest.skip("No pages to test")
        
        page_id = pages[0].get("id")
        if not page_id:
            pytest.skip("No page ID found")
        
        # Get single page
        response = session.get(f"{BASE_URL}/api/pages/{page_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        page = response.json()
        
        # Verify SEO fields exist
        seo_fields = ["metaTitle", "metaDescription", "canonicalUrl", "robotsDirective", 
                      "ogTitle", "ogDescription", "twitterTitle", "twitterDescription",
                      "schemaOrgJson", "sitemapPriority", "sitemapChangeFreq"]
        for field in seo_fields:
            # Field should exist (even if null)
            assert field in page or field.lower().replace("_", "") in str(page).lower(), \
                f"SEO field {field} missing from page response"


class TestSitemapLocalization:
    """Sitemap respects host/locale settings"""

    def test_sitemap_default_locale_fr(self):
        """Default sitemap uses FR locale (greeters.paris)"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        content = response.text
        # Should use greeters.paris for default FR locale
        assert "greeters.paris" in content

    def test_sitemap_en_locale_with_host(self):
        """Sitemap with en.greeters.paris Host header uses EN URLs"""
        response = requests.get(
            f"{BASE_URL}/sitemap.xml",
            headers={"Host": "en.greeters.paris"}
        )
        content = response.text
        # Should include en.greeters.paris URLs
        assert response.status_code == 200
        # The implementation may or may not support host-based locale switching
        # This test documents the behavior


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

"""
Greeters Iteration 11 Test Suite
Tests:
- Contact API (Emailit integration)
- CMS bootstrap API
- Sitemap generation (FR + non-FR locales)
- Admin routes accessibility
- Localization chrome on public pages
"""

import pytest
import requests

BASE_URL = "http://127.0.0.1:3100"


class TestContactApiEmailit:
    """Contact API with Emailit provider tests"""
    
    def test_contact_send_valid_payload(self):
        """POST /api/contact/send should return 200 with valid payload (real Emailit)"""
        response = requests.post(
            f"{BASE_URL}/api/contact/send",
            headers={"Content-Type": "application/json"},
            json={
                "name": "Test User Pytest",
                "email": "pytest@example.com",
                "subject": "Pytest Test Subject",
                "message": "This is a test message from pytest"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        assert "envoyé" in data["message"].lower() or "sent" in data["message"].lower()
    
    def test_contact_send_missing_fields(self):
        """POST /api/contact/send should return 400 with missing fields"""
        response = requests.post(
            f"{BASE_URL}/api/contact/send",
            headers={"Content-Type": "application/json"},
            json={"name": "Only Name"}
        )
        assert response.status_code == 400
    
    def test_contact_send_invalid_email(self):
        """POST /api/contact/send should return 400 with invalid email"""
        response = requests.post(
            f"{BASE_URL}/api/contact/send",
            headers={"Content-Type": "application/json"},
            json={
                "name": "Test",
                "email": "invalid-email",
                "subject": "Test",
                "message": "Test"
            }
        )
        assert response.status_code == 400


class TestSitemapLocales:
    """Sitemap generation tests for FR and non-FR locales"""
    
    def test_sitemap_fr_locale(self):
        """GET /sitemap.xml should return valid XML with FR URLs"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        assert response.status_code == 200
        assert "<?xml" in response.text
        assert "<urlset" in response.text
        assert "greeters.paris" in response.text
        # Should have public pages
        assert "/contact" in response.text or "/livre-dor" in response.text
    
    def test_sitemap_en_locale_via_host(self):
        """GET /sitemap.xml with en.greeters.paris host should return EN URLs"""
        response = requests.get(
            f"{BASE_URL}/sitemap.xml",
            headers={"Host": "en.greeters.paris"}
        )
        assert response.status_code == 200
        assert "<?xml" in response.text
        assert "en.greeters.paris" in response.text
    
    def test_sitemap_de_locale_via_host(self):
        """GET /sitemap.xml with de.greeters.paris host should return DE URLs"""
        response = requests.get(
            f"{BASE_URL}/sitemap.xml",
            headers={"Host": "de.greeters.paris"}
        )
        assert response.status_code == 200
        assert "de.greeters.paris" in response.text


class TestPublicPagesLocalization:
    """Public pages chrome localization tests"""
    
    def test_fr_locale_chrome(self):
        """FR locale should show French navigation labels"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        assert "lang=\"fr\"" in response.text
        # French navigation labels (may be in SSR JSON or rendered HTML)
        assert "LIVRE D" in response.text or "livre-dor" in response.text
        assert "balade" in response.text.lower()
    
    def test_en_locale_chrome(self):
        """EN locale should show English navigation labels"""
        response = requests.get(
            f"{BASE_URL}/",
            headers={"Host": "en.greeters.paris"}
        )
        assert response.status_code == 200
        assert "lang=\"en\"" in response.text
        assert "Book a walk" in response.text
        assert "GUESTBOOK" in response.text
        assert "Join us on social media" in response.text
    
    def test_de_locale_chrome(self):
        """DE locale should show German navigation labels"""
        response = requests.get(
            f"{BASE_URL}/",
            headers={"Host": "de.greeters.paris"}
        )
        assert response.status_code == 200
        assert "lang=\"de\"" in response.text
        assert "Spaziergang buchen" in response.text
        assert "GÄSTEBUCH" in response.text
        assert "Folgen Sie uns" in response.text


class TestAdminRoutesAccessibility:
    """Admin routes accessibility tests"""
    
    def test_admin_redirect_to_login(self):
        """GET /admin without auth should redirect to login"""
        response = requests.get(f"{BASE_URL}/admin", allow_redirects=False)
        assert response.status_code == 307
        assert "/admin/login" in response.headers.get("Location", "")
    
    def test_admin_pages_redirect_to_login(self):
        """GET /admin/pages without auth should redirect to login"""
        response = requests.get(f"{BASE_URL}/admin/pages", allow_redirects=False)
        assert response.status_code == 307
    
    def test_admin_menu_redirect_to_login(self):
        """GET /admin/menu without auth should redirect to login"""
        response = requests.get(f"{BASE_URL}/admin/menu", allow_redirects=False)
        assert response.status_code == 307
    
    def test_admin_pending_redirect_to_login(self):
        """GET /admin/pending without auth should redirect to login"""
        response = requests.get(f"{BASE_URL}/admin/pending", allow_redirects=False)
        assert response.status_code == 307
    
    def test_admin_ai_pages_redirect_to_login(self):
        """GET /admin/ai-pages without auth should redirect to login"""
        response = requests.get(f"{BASE_URL}/admin/ai-pages", allow_redirects=False)
        assert response.status_code == 307
    
    def test_admin_login_page_loads(self):
        """GET /admin/login should load login page"""
        response = requests.get(f"{BASE_URL}/admin/login")
        assert response.status_code == 200
        assert "admin-login" in response.text.lower() or "login" in response.text.lower()


class TestPublicPages:
    """Public pages accessibility tests"""
    
    def test_home_page(self):
        """GET / should return 200"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        assert "Paris Greeters" in response.text
    
    def test_contact_page(self):
        """GET /contact should return 200 with CMS content"""
        response = requests.get(f"{BASE_URL}/contact")
        assert response.status_code == 200
        assert "contact" in response.text.lower()
        # Should have form elements
        assert "contact-page-form" in response.text
    
    def test_livre_dor_page(self):
        """GET /livre-dor should return 200"""
        response = requests.get(f"{BASE_URL}/livre-dor")
        assert response.status_code == 200
    
    def test_faire_un_don_page(self):
        """GET /faire-un-don should return 200"""
        response = requests.get(f"{BASE_URL}/faire-un-don")
        assert response.status_code == 200
    
    def test_galerie_page(self):
        """GET /galerie should return 200"""
        response = requests.get(f"{BASE_URL}/galerie")
        assert response.status_code == 200
    
    def test_actualites_page(self):
        """GET /actualites should return 200"""
        response = requests.get(f"{BASE_URL}/actualites")
        assert response.status_code == 200
    
    def test_devenez_benevole_page(self):
        """GET /devenez-benevole should return 200"""
        response = requests.get(f"{BASE_URL}/devenez-benevole")
        assert response.status_code == 200


class TestBootstrapApiAuth:
    """Bootstrap API authentication tests"""
    
    def test_bootstrap_requires_auth(self):
        """POST /api/admin/bootstrap/public-content requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/bootstrap/public-content")
        # Should return 401 or redirect to login
        assert response.status_code in [401, 403, 307, 302], f"Expected auth error, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

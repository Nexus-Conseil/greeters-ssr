import os

import pytest
import requests

# Scope regression: localized sitemap, admin menu/ai access, Gemini draft generation, and cleanup of legacy live validation pages
BASE_URL = os.environ.get("GREETERS_BASE_URL")

if not BASE_URL:
    pytest.skip("GREETERS_BASE_URL is not configured", allow_module_level=True)

BASE_URL = BASE_URL.rstrip("/")
ADMIN_EMAIL = "contact@nexus-conseil.ch"
ADMIN_PASSWORD = "Greeters&58!2026"


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _attach_session_cookie(api_client: requests.Session, response: requests.Response):
    set_cookie = response.headers.get("set-cookie", "")
    cookie_pair = set_cookie.split(";", 1)[0]
    if cookie_pair.startswith("greeters_session="):
        api_client.headers.update({"Cookie": cookie_pair})


@pytest.fixture
def authenticated_admin(api_client):
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["user"]["email"] == ADMIN_EMAIL
    _attach_session_cookie(api_client, response)
    return api_client


def test_sitemap_xml_default_domain_returns_tourism_sitemap_structure(api_client):
    response = api_client.get(f"{BASE_URL}/sitemap.xml", headers={"Host": "greeters.paris"})

    assert response.status_code == 200
    assert "application/xml" in response.headers.get("content-type", "")
    xml = response.text
    assert "<urlset" in xml
    assert "https://greeters.paris/" in xml
    assert "Pages d’accueil" in xml
    assert "Pages internes utiles aux touristes" in xml


def test_sitemap_xml_en_subdomain_uses_en_locale_urls(api_client):
    response = api_client.get(f"{BASE_URL}/sitemap.xml", headers={"Host": "en.greeters.paris"})

    assert response.status_code == 200
    xml = response.text
    assert "<urlset" in xml
    assert "https://en.greeters.paris/" in xml
    assert "https://greeters.paris/" not in xml


def test_footer_contains_sitemap_link(api_client):
    response = api_client.get(f"{BASE_URL}/")

    assert response.status_code == 200
    html = response.text
    assert 'data-testid="public-footer-link-sitemap"' in html
    assert 'href="/sitemap.xml"' in html


def test_admin_menu_page_accessible_after_login(authenticated_admin):
    response = authenticated_admin.get(f"{BASE_URL}/admin/menu")

    assert response.status_code == 200
    assert 'data-testid="admin-menu-page"' in response.text
    assert 'data-testid="admin-menu-title"' in response.text


def test_admin_ai_pages_page_accessible_after_login(authenticated_admin):
    response = authenticated_admin.get(f"{BASE_URL}/admin/ai-pages")

    assert response.status_code == 200
    assert 'data-testid="ai-page-studio-page"' in response.text
    assert 'data-testid="ai-page-studio-generate-button"' in response.text


def test_ai_page_generator_returns_draft_with_gemini(authenticated_admin):
    response = authenticated_admin.post(
        f"{BASE_URL}/api/ai/page-generator",
        json={
            "locale": "fr",
            "prompt": "Créer une page touristique originale sur une balade photo au lever du soleil autour du Canal Saint-Martin, avec conseils pratiques.",
        },
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert isinstance(payload.get("sessionId"), str)
    assert len(payload["sessionId"]) > 0
    generated = payload["generatedPage"]
    assert generated["locale"] == "fr"
    assert isinstance(generated["title"], str) and generated["title"].strip() != ""
    assert isinstance(generated["slug"], str) and generated["slug"].strip() != ""
    assert isinstance(generated["sections"], list)
    assert len(generated["sections"]) >= 1
    assert isinstance(payload.get("messages"), list)
    assert len(payload["messages"]) >= 2


def test_no_legacy_live_validation_pages_remaining(authenticated_admin):
    response = authenticated_admin.get(f"{BASE_URL}/api/pages")

    assert response.status_code == 200
    pages = response.json()
    assert isinstance(pages, list)

    legacy_markers = [
        "validation live",
        "validation-live",
        "live validation",
        "live-validation",
    ]

    offending_pages = []
    for page in pages:
        searchable = f"{page.get('title', '')} {page.get('slug', '')}".lower()
        if any(marker in searchable for marker in legacy_markers):
            offending_pages.append(
                {
                    "id": page.get("id"),
                    "title": page.get("title"),
                    "slug": page.get("slug"),
                }
            )

    assert offending_pages == []

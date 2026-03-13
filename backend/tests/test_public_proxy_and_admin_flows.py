import os
import uuid

import pytest
import requests
from dotenv import dotenv_values


def _load_base_url() -> str:
    base_url = os.environ.get("REACT_APP_BACKEND_URL")
    if not base_url:
        base_url = dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL")
    if not base_url:
        pytest.skip("REACT_APP_BACKEND_URL is not configured", allow_module_level=True)
    return str(base_url).rstrip("/")


BASE_URL = _load_base_url()
ADMIN_EMAIL = "florence.levot@nexus-conseil.ch"
ADMIN_PASSWORD = "Greeters&58!"


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def authenticated_client(api_client):
    # Admin auth flow coverage for login -> me -> logout capable session
    login_response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=45,
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["user"]["email"] == ADMIN_EMAIL
    assert login_data["user"]["role"] == "SUPER_ADMIN"
    return api_client


def test_homepage_ssr_returns_200(api_client):
    response = api_client.get(f"{BASE_URL}/", timeout=45)
    assert response.status_code == 200
    assert "<html" in response.text.lower()
    assert "paris greeters" in response.text.lower()


def test_contact_page_ssr_returns_200(api_client):
    response = api_client.get(f"{BASE_URL}/contact", timeout=45)
    assert response.status_code == 200
    assert "<html" in response.text.lower()
    assert "contact" in response.text.lower()


def test_health_proxy_returns_ok(api_client):
    response = api_client.get(f"{BASE_URL}/api/health", timeout=30)
    assert response.status_code == 200
    payload = response.json()
    assert payload.get("status") == "ok"


def test_public_pages_proxy_returns_pages(api_client):
    response = api_client.get(f"{BASE_URL}/api/pages/public", timeout=45)
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert len(payload) > 0


def test_chatbot_public_api_returns_content(api_client):
    response = api_client.post(
        f"{BASE_URL}/api/chat/message",
        json={
            "session_id": f"TEST_chat_{uuid.uuid4().hex}",
            "message": "Bonjour, je souhaite réserver une balade.",
            "language": "fr",
        },
        timeout=120,
    )
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload.get("content"), str)
    assert payload["content"].strip() != ""


def test_contact_send_proxy_works_publicly(api_client):
    response = api_client.post(
        f"{BASE_URL}/api/contact/send",
        json={
            "name": "TEST QA",
            "email": "test.qa@example.com",
            "subject": "Test intégration",
            "message": "Message de test automatisé",
            "locale": "fr",
        },
        timeout=60,
    )
    assert response.status_code == 200
    payload = response.json()
    assert "message" in payload
    assert "envoy" in payload["message"].lower()


def test_admin_auth_public_flow_login_me_logout(api_client):
    login_response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=45,
    )
    assert login_response.status_code == 200
    login_payload = login_response.json()
    assert login_payload["user"]["email"] == ADMIN_EMAIL
    assert login_payload["user"]["role"] == "SUPER_ADMIN"

    me_response = api_client.get(f"{BASE_URL}/api/auth/me", timeout=30)
    assert me_response.status_code == 200
    me_payload = me_response.json()
    assert me_payload["email"] == ADMIN_EMAIL
    assert me_payload["role"] == "SUPER_ADMIN"

    logout_response = api_client.post(f"{BASE_URL}/api/auth/logout", json={}, timeout=30)
    assert logout_response.status_code == 200
    logout_payload = logout_response.json()
    assert logout_payload.get("success") is True

    post_logout_me = api_client.get(f"{BASE_URL}/api/auth/me", timeout=30)
    assert post_logout_me.status_code == 401


def test_authenticated_pages_and_menu_proxies_work(authenticated_client):
    pages_response = authenticated_client.get(f"{BASE_URL}/api/pages?locale=fr&limit=20", timeout=45)
    assert pages_response.status_code == 200
    pages_payload = pages_response.json()
    assert isinstance(pages_payload, list)

    menu_response = authenticated_client.get(f"{BASE_URL}/api/menu?locale=fr", timeout=45)
    assert menu_response.status_code == 200
    menu_payload = menu_response.json()
    assert isinstance(menu_payload, dict)
    assert isinstance(menu_payload.get("items"), list)


def test_ai_page_generator_and_session_fetch(authenticated_client):
    response = authenticated_client.post(
        f"{BASE_URL}/api/ai/page-generator",
        json={
            "prompt": "Créer une page sur les balades street art à Belleville avec 3 sections.",
            "locale": "fr",
        },
        timeout=180,
    )
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload.get("sessionId"), str)
    assert payload["sessionId"].strip() != ""
    assert isinstance(payload.get("generatedPage"), dict)
    assert payload["generatedPage"].get("title")
    assert isinstance(payload["generatedPage"].get("sections"), list)

    session_id = payload["sessionId"]
    get_session = authenticated_client.get(f"{BASE_URL}/api/ai/page-generator/{session_id}", timeout=60)
    assert get_session.status_code == 200
    session_payload = get_session.json()
    assert session_payload.get("id") == session_id
    assert isinstance(session_payload.get("messages"), list)
    assert isinstance(session_payload.get("latestDraft"), dict)


def test_ai_seo_optimizer_works_for_admin(authenticated_client):
    sample_page = {
        "locale": "fr",
        "title": "TEST Balade photo à Montmartre",
        "slug": "test-balade-photo-montmartre",
        "metaTitle": "Balade photo Montmartre",
        "metaDescription": "Découvrez Montmartre avec un greeter photographe.",
        "metaKeywords": "montmartre, photo, greeters",
        "canonicalUrl": "https://greeters.paris/test-balade-photo-montmartre",
        "robotsDirective": "index,follow",
        "ogTitle": "Balade photo Montmartre",
        "ogDescription": "Une balade photo guidée à Montmartre.",
        "ogImageUrl": "https://images.unsplash.com/photo-1472396961693-142e6e269027",
        "ogImageAlt": "Montmartre",
        "twitterTitle": "Balade photo Montmartre",
        "twitterDescription": "Une balade photo guidée à Montmartre.",
        "twitterImageUrl": "https://images.unsplash.com/photo-1472396961693-142e6e269027",
        "focusKeyword": "balade photo montmartre",
        "secondaryKeywords": "greeters paris, montmartre visite",
        "schemaOrgJson": "{}",
        "imageRecommendations": [],
        "sitemapPriority": 0.7,
        "sitemapChangeFreq": "monthly",
        "isInMenu": False,
        "menuOrder": 0,
        "menuLabel": "Balade photo",
        "sections": [
            {
                "id": f"section-{uuid.uuid4().hex}",
                "name": "Introduction",
                "layout": "hero",
                "background": "white",
                "backgroundImage": None,
                "order": 0,
                "blocks": [
                    {
                        "id": f"block-{uuid.uuid4().hex}",
                        "type": "heading",
                        "order": 0,
                        "content": {"text": "Balade photo à Montmartre", "level": "h1"},
                    },
                    {
                        "id": f"block-{uuid.uuid4().hex}",
                        "type": "text",
                        "order": 1,
                        "content": {"text": "Explorez les ruelles et ateliers d'artistes."},
                    },
                ],
            }
        ],
    }

    response = authenticated_client.post(
        f"{BASE_URL}/api/ai/seo-optimizer",
        json={"page": sample_page, "locale": "fr", "instructions": "Ton institutionnel et clair."},
        timeout=180,
    )
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload.get("optimization"), dict)
    assert isinstance(payload["optimization"].get("metaTitle"), str)
    assert payload["optimization"]["metaTitle"].strip() != ""
    assert isinstance(payload["optimization"].get("optimizationSummary"), str)

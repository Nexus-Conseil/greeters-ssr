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


# Gemini migration regression: health, auth, chat, AI page generation, SEO optimization, and public home.
BASE_URL = _load_base_url()
FINAL_ADMIN_EMAIL = "florence.levot@nexus-conseil.ch"
FINAL_ADMIN_PASSWORD = "Greeters&58!"


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def authenticated_client(api_client):
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": FINAL_ADMIN_EMAIL, "password": FINAL_ADMIN_PASSWORD},
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("user", {}).get("email") == FINAL_ADMIN_EMAIL
    return api_client


def test_health_endpoint_is_operational(api_client):
    response = api_client.get(f"{BASE_URL}/api/health", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"


def test_admin_login_final_still_works(api_client):
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": FINAL_ADMIN_EMAIL, "password": FINAL_ADMIN_PASSWORD},
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("user", {}).get("email") == FINAL_ADMIN_EMAIL
    assert data.get("user", {}).get("role") == "SUPER_ADMIN"


def test_chat_message_after_gemini_migration(api_client):
    session_id = f"TEST_GEMINI_CHAT_{uuid.uuid4().hex[:10]}"
    payload = {
        "session_id": session_id,
        "visitor_id": f"visitor_{session_id}",
        "message": "Bonjour, propose une balade culturelle à Paris pour demain.",
        "language": "fr",
    }
    message_response = api_client.post(f"{BASE_URL}/api/chat/message", json=payload, timeout=120)
    assert message_response.status_code == 200
    message_data = message_response.json()
    assert isinstance(message_data.get("content"), str)
    assert message_data.get("content", "").strip() != ""
    assert message_data.get("session_id") == session_id


def test_ai_page_generator_create_and_get_session(authenticated_client):
    prompt = f"Créer une page pour une visite street-art test {uuid.uuid4().hex[:6]}"
    create_response = authenticated_client.post(
        f"{BASE_URL}/api/ai/page-generator",
        json={"prompt": prompt, "locale": "fr"},
        timeout=120,
    )
    assert create_response.status_code == 200
    create_data = create_response.json()
    assert isinstance(create_data.get("sessionId"), str)
    assert create_data.get("sessionId", "").strip() != ""
    generated_page = create_data.get("generatedPage")
    assert isinstance(generated_page, dict)
    assert isinstance(generated_page.get("title"), str)
    assert isinstance(generated_page.get("sections"), list)
    assert len(generated_page.get("sections", [])) >= 1

    session_id = create_data["sessionId"]
    get_response = authenticated_client.get(f"{BASE_URL}/api/ai/page-generator/{session_id}", timeout=60)
    assert get_response.status_code == 200
    get_data = get_response.json()
    assert get_data.get("id") == session_id
    assert isinstance(get_data.get("latestDraft"), dict)
    assert get_data.get("latestDraft", {}).get("title") == generated_page.get("title")


def test_ai_seo_optimizer_after_migration(authenticated_client):
    page_payload = {
        "title": "Balade gourmande à Paris",
        "slug": "balade-gourmande-paris",
        "locale": "fr",
        "metaTitle": "Balade gourmande à Paris | Paris Greeters",
        "metaDescription": "Découvrez Paris à travers ses saveurs locales.",
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
                        "order": 0,
                        "content": {"text": "Une visite culinaire conviviale au cœur de Paris."},
                    },
                    {
                        "id": "block-2",
                        "type": "image",
                        "order": 1,
                        "content": {
                            "src": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
                            "alt": "Spécialités parisiennes",
                        },
                    },
                ],
            }
        ],
    }

    response = authenticated_client.post(
        f"{BASE_URL}/api/ai/seo-optimizer",
        json={"page": page_payload, "locale": "fr", "instructions": "Optimise pour une intention de découverte locale."},
        timeout=120,
    )
    assert response.status_code == 200
    data = response.json()
    optimization = data.get("optimization")
    assert isinstance(optimization, dict)
    assert isinstance(optimization.get("metaTitle"), str)
    assert optimization.get("metaTitle", "").strip() != ""
    assert isinstance(optimization.get("metaDescription"), str)
    assert isinstance(optimization.get("canonicalUrl"), str)
    assert "greeters.paris" in optimization.get("canonicalUrl", "")


def test_public_homepage_is_operational(api_client):
    response = api_client.get(f"{BASE_URL}/", timeout=30)
    assert response.status_code == 200
    html = response.text.lower()
    assert "<html" in html
    assert "_next" in html

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


# Refactor regression coverage: app bootstrap, auth proxy, chat API, and public homepage.
BASE_URL = _load_base_url()
FINAL_ADMIN_EMAIL = "florence.levot@nexus-conseil.ch"
FINAL_ADMIN_PASSWORD = "Greeters&58!"


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def test_api_root_alive(api_client):
    response = api_client.get(f"{BASE_URL}/api/", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert data.get("message") == "Hello World"


def test_health_proxy_still_ok(api_client):
    response = api_client.get(f"{BASE_URL}/api/health", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"


def test_admin_login_proxy_still_works(api_client):
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": FINAL_ADMIN_EMAIL, "password": FINAL_ADMIN_PASSWORD},
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("user", {}).get("email") == FINAL_ADMIN_EMAIL
    assert data.get("user", {}).get("role") == "SUPER_ADMIN"


def test_chat_message_and_session_persistence(api_client):
    session_id = f"TEST_REFACTOR_{uuid.uuid4().hex[:10]}"
    payload = {
        "session_id": session_id,
        "visitor_id": f"visitor_{session_id}",
        "message": "Bonjour, je veux réserver une balade à Paris.",
        "language": "fr",
    }
    message_response = api_client.post(f"{BASE_URL}/api/chat/message", json=payload, timeout=90)
    assert message_response.status_code == 200
    message_data = message_response.json()
    assert isinstance(message_data.get("content"), str)
    assert message_data.get("content", "").strip() != ""
    assert message_data.get("session_id") == session_id

    session_response = api_client.get(f"{BASE_URL}/api/chat/session/{session_id}", timeout=30)
    assert session_response.status_code == 200
    session_data = session_response.json()
    assert session_data.get("session_id") == session_id
    assert isinstance(session_data.get("messages"), list)
    assert len(session_data.get("messages", [])) >= 2


def test_public_homepage_still_served(api_client):
    response = api_client.get(f"{BASE_URL}/", timeout=30)
    assert response.status_code == 200
    html = response.text.lower()
    assert "<html" in html
    assert "_next" in html

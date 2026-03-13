import os
import uuid

import pytest
import requests
from dotenv import dotenv_values


def _load_public_base_url() -> str:
    base_url = os.environ.get("NEXT_PUBLIC_CHAT_API_URL")
    if not base_url:
        values = dotenv_values("/app/greeters/.env")
        base_url = values.get("NEXT_PUBLIC_CHAT_API_URL")
    if not base_url:
        pytest.skip("NEXT_PUBLIC_CHAT_API_URL is not configured", allow_module_level=True)
    return str(base_url).rstrip("/")


BASE_URL = _load_public_base_url()


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def test_api_root_health(api_client):
    response = api_client.get(f"{BASE_URL}/api/", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Hello World"


def test_chat_message_returns_valid_content(api_client):
    payload = {
        "session_id": f"TEST_{uuid.uuid4().hex}",
        "message": "Bonjour, comment réserver une balade ?",
        "language": "fr",
    }
    response = api_client.post(f"{BASE_URL}/api/chat/message", json=payload, timeout=90)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("content"), str)
    assert data["content"].strip() != ""


def test_chat_message_invalid_payload_returns_422(api_client):
    payload = {"session_id": f"TEST_{uuid.uuid4().hex}", "language": "fr"}
    response = api_client.post(f"{BASE_URL}/api/chat/message", json=payload, timeout=30)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
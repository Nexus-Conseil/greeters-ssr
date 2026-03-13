import os

import pytest
import requests
from dotenv import dotenv_values


def _load_base_url() -> str:
    base_url = os.environ.get("REACT_APP_BACKEND_URL")
    if not base_url:
        base_url = dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL")
    if not base_url:
        pytest.skip("REACT_APP_BACKEND_URL is not configured")
    return str(base_url).rstrip("/")


BASE_URL = _load_base_url()


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def test_homepage_public_route_returns_200(api_client):
    response = api_client.get(f"{BASE_URL}/", timeout=30)
    assert response.status_code == 200
    assert "<html" in response.text.lower()


def test_contact_public_route_returns_200(api_client):
    response = api_client.get(f"{BASE_URL}/contact", timeout=30)
    assert response.status_code == 200
    assert "<html" in response.text.lower()
    assert "contact" in response.text.lower()


def test_next_api_health_returns_ok(api_client):
    response = api_client.get(f"{BASE_URL}/api/health", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"


def test_public_pages_api_returns_content(api_client):
    response = api_client.get(f"{BASE_URL}/api/pages/public", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_chatbot_api_message_success(api_client):
    payload = {
        "session_id": "TEST_deployment_readiness",
        "message": "Bonjour, je veux réserver une balade.",
        "language": "fr",
    }
    response = api_client.post(f"{BASE_URL}/api/chat/message", json=payload, timeout=90)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("content"), str)
    assert data["content"].strip() != ""
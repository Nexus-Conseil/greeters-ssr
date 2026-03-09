import os

import pytest
import requests

# Public shell pages and API access-control regression tests
BASE_URL = os.environ.get("GREETERS_BASE_URL")

if not BASE_URL:
    pytest.skip("GREETERS_BASE_URL is not configured", allow_module_level=True)

BASE_URL = BASE_URL.rstrip("/")


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def test_health_endpoint_returns_ok_payload(api_client):
    response = api_client.get(f"{BASE_URL}/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "greeters-next"
    assert isinstance(payload["timestamp"], str)


def test_pages_endpoint_requires_authentication(api_client):
    response = api_client.get(f"{BASE_URL}/api/pages")

    assert response.status_code == 401
    payload = response.json()
    assert payload["detail"] == "Authentification requise."


def test_public_home_page_renders_shell_structure(api_client):
    response = api_client.get(f"{BASE_URL}/")

    assert response.status_code == 200
    html = response.text
    assert 'data-testid="public-home-page"' in html
    assert 'data-testid="public-header"' in html
    assert 'data-testid="public-footer"' in html


def test_galerie_placeholder_route_renders_public_placeholder(api_client):
    response = api_client.get(f"{BASE_URL}/galerie")

    assert response.status_code == 200
    html = response.text
    assert 'data-testid="public-placeholder-page-galerie"' in html
    assert 'data-testid="public-placeholder-title-galerie"' in html
    assert "Galerie" in html


def test_admin_login_route_renders_login_form(api_client):
    response = api_client.get(f"{BASE_URL}/admin/login")

    assert response.status_code == 200
    html = response.text
    assert 'data-testid="admin-login-page"' in html
    assert 'data-testid="admin-login-email-input"' in html
    assert 'data-testid="admin-login-submit-button"' in html

import os
import uuid
from typing import Dict

import pytest
import requests

# Authenticated admin CMS live flow regression tests (login, pages CRUD subset, menu sync, public SSR)
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
def test_page_state() -> Dict[str, str]:
    return {}


@pytest.fixture
def authenticated_admin(api_client):
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["user"]["email"] == ADMIN_EMAIL
    assert payload["sessionDurationDays"] == 7

    cookie_header = response.headers.get("set-cookie", "")
    assert "greeters_session=" in cookie_header
    _attach_session_cookie(api_client, response)

    return api_client


@pytest.fixture(autouse=True)
def cleanup_created_page(authenticated_admin, test_page_state):
    yield

    page_id = test_page_state.get("id")
    if page_id:
        authenticated_admin.delete(f"{BASE_URL}/api/pages/{page_id}")


def _build_page_payload(unique_suffix: str):
    return {
        "title": f"TEST Live Page {unique_suffix}",
        "slug": f"test-live-page-{unique_suffix}",
        "metaDescription": "Page de test e2e live",
        "metaKeywords": "test,live,cms",
        "sections": [
            {
                "id": "sec-1",
                "name": "Hero",
                "layout": "default",
                "background": "white",
                "backgroundImage": None,
                "order": 0,
                "blocks": [
                    {
                        "id": "block-1",
                        "type": "text",
                        "order": 0,
                        "content": {"text": f"Contenu initial {unique_suffix}"},
                    }
                ],
            }
        ],
        "isInMenu": True,
        "menuOrder": 88,
        "menuLabel": f"TEST Menu {unique_suffix}",
    }


def test_admin_login_and_me_live_credentials(authenticated_admin):
    response = authenticated_admin.get(f"{BASE_URL}/api/auth/me")

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] in ["SUPER_ADMIN", "ADMIN"]


def test_authenticated_access_to_admin_pages(authenticated_admin):
    response = authenticated_admin.get(f"{BASE_URL}/admin/pages")

    assert response.status_code == 200
    assert 'data-testid="admin-pages-page"' in response.text


def test_create_edit_publish_and_public_visibility(authenticated_admin, test_page_state):
    unique_suffix = uuid.uuid4().hex[:8]
    create_payload = _build_page_payload(unique_suffix)

    create_response = authenticated_admin.post(f"{BASE_URL}/api/pages", json=create_payload)
    assert create_response.status_code == 201, create_response.text

    created = create_response.json()
    assert created["title"] == create_payload["title"]
    assert created["slug"] == create_payload["slug"]
    assert created["status"] == "published"
    assert created["isInMenu"] is True
    assert created["menuLabel"] == create_payload["menuLabel"]

    page_id = created["id"]
    test_page_state["id"] = page_id
    test_page_state["slug"] = created["slug"]

    get_created_response = authenticated_admin.get(f"{BASE_URL}/api/pages/{page_id}")
    assert get_created_response.status_code == 200
    fetched = get_created_response.json()
    assert fetched["id"] == page_id
    assert fetched["title"] == create_payload["title"]

    update_payload = {
        "title": f"TEST Live Page UPDATED {unique_suffix}",
        "menuLabel": f"TEST Menu UPDATED {unique_suffix}",
        "status": "published",
    }
    update_response = authenticated_admin.put(f"{BASE_URL}/api/pages/{page_id}", json=update_payload)
    assert update_response.status_code == 200, update_response.text
    updated = update_response.json()
    assert updated["title"] == update_payload["title"]
    assert updated["menuLabel"] == update_payload["menuLabel"]
    assert updated["status"] == "published"

    list_response = authenticated_admin.get(f"{BASE_URL}/api/pages")
    assert list_response.status_code == 200
    pages = list_response.json()
    matching_page = next((page for page in pages if page["id"] == page_id), None)
    assert matching_page is not None
    assert matching_page["status"] == "published"

    menu_response = authenticated_admin.get(f"{BASE_URL}/api/menu")
    assert menu_response.status_code == 200
    menu_payload = menu_response.json()
    expected_href = f"/{created['slug']}"
    menu_item = next((item for item in menu_payload["items"] if item["href"] == expected_href), None)
    assert menu_item is not None
    assert menu_item["label"] == update_payload["menuLabel"]

    public_response = authenticated_admin.get(f"{BASE_URL}/{created['slug']}")
    assert public_response.status_code == 200
    assert f'data-testid="public-live-page-{created["slug"]}"' in public_response.text
    assert update_payload["menuLabel"] in public_response.text

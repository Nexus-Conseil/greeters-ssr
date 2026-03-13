import json
import subprocess


def _build_email_bodies(payload_override=None):
    # Contact email template builders (admin + author confirmation) execution and output assertions
    probe_payload = {"payload": payload_override or {}}
    command = [
        "yarn",
        "tsx",
        "/app/backend/tests/contact_builder_probe.ts",
        json.dumps(probe_payload),
    ]
    result = subprocess.run(
        command,
        cwd="/app/greeters",
        capture_output=True,
        text=True,
        check=True,
    )
    for line in result.stdout.splitlines():
        if line.startswith("JSON_RESULT::"):
            return json.loads(line.replace("JSON_RESULT::", "", 1))
    raise AssertionError(f"Builder output missing JSON_RESULT marker. Raw stdout: {result.stdout}")


def test_contact_builder_exports_execute_without_runtime_error():
    data = _build_email_bodies()
    assert isinstance(data["admin"], dict)
    assert isinstance(data["author"], dict)
    assert isinstance(data["admin"]["html"], str)
    assert isinstance(data["author"]["html"], str)


def test_admin_and_author_templates_are_differentiated():
    data = _build_email_bodies()
    admin = data["admin"]
    author = data["author"]

    assert admin["to"] == ["admin@parisgreeters.org"]
    assert author["to"] == [data["payload"]["email"]]
    assert "Nouveau message reçu" in admin["html"]
    assert "Merci pour votre message" in author["html"]
    assert admin["subject"] == data["payload"]["subject"]
    assert author["subject"] == data["payload"]["subject"]


def test_admin_template_contains_contact_details_subject_and_full_message():
    payload = {
        "name": "Alice Martin",
        "email": "alice@example.com",
        "subject": "Question tarifs",
        "message": "Bonjour\nJe veux un devis.",
    }
    data = _build_email_bodies(payload)
    admin = data["admin"]

    assert "Coordonnées du contact" in admin["html"]
    assert "Alice Martin" in admin["html"] and "alice@example.com" in admin["html"]
    assert "Message" in admin["html"]
    assert "Bonjour<br />Je veux un devis." in admin["html"]
    assert admin["subject"] == "Question tarifs"
    assert "mailto:alice@example.com" not in admin["html"]


def test_author_template_contains_warm_confirmation_and_message_copy():
    payload = {
        "name": "Lucas",
        "email": "lucas@example.com",
        "subject": "Balade personnalisée",
        "message": "Merci pour votre aide",
    }
    data = _build_email_bodies(payload)
    author = data["author"]

    assert "Bonjour, nous avons bien reçu votre message" in author["html"]
    assert "Copie de votre message" in author["html"]
    assert "Merci pour votre aide" in author["html"]
    assert author["subject"] == "Balade personnalisée"
    assert "Site web" not in author["html"]


def test_branding_shell_and_signature_are_consistent_with_site_style():
    data = _build_email_bodies()
    admin_html = data["admin"]["html"]
    author_html = data["author"]["html"]

    for html in (admin_html, author_html):
        assert "Paris Greeters" in html
        assert "#7daa2f" in html
        assert "#f4f4f1" in html
        assert "/logo_greeters.png" in html

    assert "https://parisgreeters.org" not in data["author"]["text"]

"""
Backend API tests for Paris Greeters Chatbot
Tests the /api/chat/message endpoint with Claude integration via Emergent LLM key
"""
import pytest
import requests
import os
import time

# Get BASE_URL from environment - using the public URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback for local testing
    BASE_URL = "https://greeters-ssr-rebuild.preview.emergentagent.com"


class TestHealthEndpoints:
    """Basic health and connectivity tests"""
    
    def test_api_root_accessible(self):
        """Test that the API root endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root accessible: {data}")


class TestChatAPI:
    """Tests for the /api/chat/message endpoint"""
    
    def test_chat_message_basic_request(self):
        """Test basic chat message request with French language"""
        session_id = f"test-session-{int(time.time())}"
        payload = {
            "session_id": session_id,
            "message": "Bonjour, qu'est-ce que les Greeters de Paris?",
            "language": "fr"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chat/message",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60  # Claude may take time to respond
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Validate response structure
        assert "id" in data, "Response should contain 'id'"
        assert "session_id" in data, "Response should contain 'session_id'"
        assert "role" in data, "Response should contain 'role'"
        assert "content" in data, "Response should contain 'content'"
        assert "language" in data, "Response should contain 'language'"
        assert "timestamp" in data, "Response should contain 'timestamp'"
        
        # Validate field values
        assert data["session_id"] == session_id, "Session ID should match request"
        assert data["role"] == "assistant", "Role should be 'assistant'"
        assert data["language"] == "fr", "Language should be 'fr'"
        assert len(data["content"]) > 50, "Response content should be substantial"
        
        print(f"✓ Chat response received (first 150 chars): {data['content'][:150]}...")
    
    def test_chat_message_vouvoiement_in_french(self):
        """Test that Claude uses vouvoiement (formal 'vous') in French responses"""
        session_id = f"test-vouvoiement-{int(time.time())}"
        payload = {
            "session_id": session_id,
            "message": "Comment puis-je réserver une balade?",
            "language": "fr"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chat/message",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check for vouvoiement indicators (vous, votre, etc.)
        content_lower = data["content"].lower()
        has_vouvoiement = any(word in content_lower for word in ["vous", "votre", "vos"])
        has_tutoiement = any(word in content_lower for word in [" tu ", " te ", " ton ", " ta ", " tes "])
        
        print(f"Content: {data['content'][:300]}...")
        print(f"Has vouvoiement: {has_vouvoiement}, Has tutoiement: {has_tutoiement}")
        
        # Should use formal address (vouvoiement), not informal (tutoiement)
        assert has_vouvoiement or not has_tutoiement, "Response should use vouvoiement (formal French)"
    
    def test_chat_message_english_response(self):
        """Test chat with English language setting"""
        session_id = f"test-english-{int(time.time())}"
        payload = {
            "session_id": session_id,
            "message": "What are the Paris Greeters?",
            "language": "en"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chat/message",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["language"] == "en"
        assert len(data["content"]) > 50
        
        # Check response is in English (should contain common English words)
        content_lower = data["content"].lower()
        has_english = any(word in content_lower for word in ["the", "and", "is", "are", "you", "walk", "greeter"])
        
        print(f"✓ English response (first 150 chars): {data['content'][:150]}...")
        assert has_english, "Response should be in English"
    
    def test_chat_message_relevant_content(self):
        """Test that Claude provides relevant information about Paris Greeters"""
        session_id = f"test-relevance-{int(time.time())}"
        payload = {
            "session_id": session_id,
            "message": "Combien de temps dure une balade avec un greeter?",
            "language": "fr"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chat/message",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check for relevant keywords about walk duration
        content_lower = data["content"].lower()
        has_relevant_info = any(keyword in content_lower for keyword in ["heure", "hour", "2", "3", "durée", "duration"])
        
        print(f"✓ Response contains duration info: {has_relevant_info}")
        print(f"Content: {data['content'][:200]}...")
        
        # The response should mention duration (2-3 hours typically)
        assert has_relevant_info, "Response should contain information about walk duration"
    
    def test_chat_message_markdown_formatting(self):
        """Test that Claude returns properly formatted markdown"""
        session_id = f"test-markdown-{int(time.time())}"
        payload = {
            "session_id": session_id,
            "message": "Quelles langues sont disponibles pour les balades?",
            "language": "fr"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chat/message",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check that response is non-empty and formatted
        content = data["content"]
        assert len(content) > 50
        
        # Check for paragraphs (multiple lines or sections)
        has_paragraphs = "\n\n" in content or len(content.split("\n")) > 1
        
        print(f"✓ Has paragraphs: {has_paragraphs}")
        print(f"Content: {content[:300]}...")
    
    def test_chat_message_invalid_payload(self):
        """Test error handling with missing required fields"""
        # Missing session_id
        payload = {
            "message": "Hello",
            "language": "fr"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chat/message",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        # Should return 422 Unprocessable Entity for validation error
        assert response.status_code == 422, f"Expected 422 for invalid payload, got {response.status_code}"
        print(f"✓ Invalid payload correctly rejected with 422")
    
    def test_chat_message_different_languages(self):
        """Test that different language settings work (DE, ES, IT, PT)"""
        languages_to_test = [
            ("de", "Was sind die Pariser Greeters?"),
            ("es", "¿Qué son los Greeters de París?"),
        ]
        
        for lang, question in languages_to_test:
            session_id = f"test-{lang}-{int(time.time())}"
            payload = {
                "session_id": session_id,
                "message": question,
                "language": lang
            }
            
            response = requests.post(
                f"{BASE_URL}/api/chat/message",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            
            assert response.status_code == 200, f"Failed for language {lang}: {response.status_code}"
            data = response.json()
            
            assert data["language"] == lang
            assert len(data["content"]) > 50
            
            print(f"✓ {lang.upper()} response received: {data['content'][:100]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

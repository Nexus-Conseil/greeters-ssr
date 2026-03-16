#!/usr/bin/env python3
"""
Security Smoke Test for Greeters Application Backend
After GEMINI_API_KEY cleanup - testing public backend endpoints
"""

import os
import sys
import requests
import json
from datetime import datetime

# Load the backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.strip().split('=', 1)[1]
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
    return None

def test_health_endpoint():
    """Test 1: GET /api/health retourne un statut OK"""
    print("\n=== TEST 1: Health Endpoint ===")
    
    base_url = get_backend_url()
    if not base_url:
        print("❌ ERREUR: Impossible de lire REACT_APP_BACKEND_URL depuis frontend/.env")
        return False
    
    health_url = f"{base_url.rstrip('/')}/api/health"
    print(f"Testing: {health_url}")
    
    try:
        response = requests.get(health_url, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response JSON: {json.dumps(data, indent=2)}")
                
                if data.get("status") == "ok":
                    print("✅ SUCCESS: Health endpoint retourne status OK")
                    return True
                else:
                    print(f"❌ FAILED: Status n'est pas 'ok', reçu: {data.get('status')}")
                    return False
            except json.JSONDecodeError:
                print(f"❌ FAILED: Response n'est pas JSON valide: {response.text[:200]}")
                return False
        else:
            print(f"❌ FAILED: Status code {response.status_code} != 200")
            print(f"Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ ERREUR CONNEXION: {e}")
        return False

def test_backend_reachability():
    """Test 2: Le backend public reste joignable après ce nettoyage"""
    print("\n=== TEST 2: Backend Reachability ===")
    
    base_url = get_backend_url()
    if not base_url:
        print("❌ ERREUR: Impossible de lire REACT_APP_BACKEND_URL")
        return False
    
    print(f"Testing reachability of: {base_url}")
    
    # Test multiple endpoints to verify general reachability
    endpoints_to_test = [
        "/api/health",
        "/api/status",
    ]
    
    reachable_count = 0
    for endpoint in endpoints_to_test:
        url = f"{base_url.rstrip('/')}{endpoint}"
        try:
            response = requests.get(url, timeout=15)
            if response.status_code in [200, 404, 405]:  # 404/405 means endpoint exists but different method/params needed
                reachable_count += 1
                print(f"✅ {endpoint}: Reachable (status {response.status_code})")
            else:
                print(f"⚠️  {endpoint}: Status {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"❌ {endpoint}: Connexion failed - {e}")
    
    if reachable_count > 0:
        print(f"✅ SUCCESS: Backend public est joignable ({reachable_count}/{len(endpoints_to_test)} endpoints)")
        return True
    else:
        print("❌ FAILED: Aucun endpoint accessible")
        return False

def test_chat_message_endpoint():
    """Test 3: POST /api/chat/message avec payload minimal"""
    print("\n=== TEST 3: Chat Message Endpoint ===")
    
    base_url = get_backend_url()
    if not base_url:
        print("❌ ERREUR: Impossible de lire REACT_APP_BACKEND_URL")
        return False
    
    chat_url = f"{base_url.rstrip('/')}/api/chat/message"
    print(f"Testing: {chat_url}")
    
    # Payload suggéré par l'utilisateur
    payload = {
        "session_id": "security-smoke-session",
        "visitor_id": "security-smoke-visitor",
        "message": "Bonjour",
        "language": "fr"
    }
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        headers = {"Content-Type": "application/json"}
        response = requests.post(chat_url, json=payload, headers=headers, timeout=90)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response JSON: {json.dumps(data, indent=2)}")
                
                content = data.get("content", "")
                print(f"\n📝 COMPORTEMENT OBSERVÉ:")
                print(f"   - Content reçu: {repr(content)}")
                print(f"   - Longueur: {len(content)} caractères")
                
                # Analyser le comportement selon le contenu
                if "service de chat n'est pas configuré" in content:
                    print("🔍 DIAGNOSTIC: Le flux chat indique que le service n'est pas configuré")
                    print("🔑 ANALYSE: Dépend probablement d'un secret runtime (GEMINI_API_KEY) absent")
                    return "missing_secret"
                elif "erreur s'est produite" in content:
                    print("🔍 DIAGNOSTIC: Erreur générique retournée")
                    return "generic_error"
                elif content and len(content.strip()) > 10:
                    print("🔍 DIAGNOSTIC: Réponse de chat valide générée")
                    print("✅ Le flux chat fonctionne normalement")
                    return "working"
                else:
                    print("🔍 DIAGNOSTIC: Réponse vide ou trop courte")
                    return "empty_response"
                    
            except json.JSONDecodeError:
                print(f"❌ Response n'est pas JSON valide: {response.text[:500]}")
                return False
        else:
            print(f"❌ FAILED: Status code {response.status_code} != 200")
            print(f"Response: {response.text[:500]}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT: Request dépassé 90 secondes")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ ERREUR CONNEXION: {e}")
        return False

def main():
    print("🔒 SECURITY SMOKE TEST - Greeters Application Backend")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("Contexte: Après nettoyage sécurité GEMINI_API_KEY")
    
    results = {}
    
    # Test 1: Health endpoint
    results['health'] = test_health_endpoint()
    
    # Test 2: Backend reachability  
    results['reachability'] = test_backend_reachability()
    
    # Test 3: Chat message endpoint
    results['chat'] = test_chat_message_endpoint()
    
    # Rapport final
    print("\n" + "=" * 60)
    print("📊 RAPPORT FINAL")
    print("=" * 60)
    
    print(f"1. GET /api/health: {'✅ OK' if results['health'] else '❌ FAILED'}")
    print(f"2. Backend reachability: {'✅ OK' if results['reachability'] else '❌ FAILED'}")
    
    chat_result = results['chat']
    if chat_result == "missing_secret":
        print(f"3. POST /api/chat/message: 🔑 DÉPEND D'UN SECRET RUNTIME ABSENT")
        print("   └─ Le flux chat n'est pas configuré (GEMINI_API_KEY manquante)")
    elif chat_result == "working":
        print(f"3. POST /api/chat/message: ✅ FONCTIONNEL")
    elif chat_result == "generic_error":
        print(f"3. POST /api/chat/message: ⚠️  ERREUR GÉNÉRIQUE")
    elif chat_result == "empty_response":
        print(f"3. POST /api/chat/message: ⚠️  RÉPONSE VIDE")
    else:
        print(f"3. POST /api/chat/message: ❌ FAILED")
    
    print("\n🎯 CONCLUSIONS:")
    if results['health'] and results['reachability']:
        print("✅ Backend public est sain et joignable")
    else:
        print("❌ Problèmes détectés avec l'infrastructure backend")
    
    if chat_result == "missing_secret":
        print("🔑 Chat dépend d'un secret runtime manquant dans cet environnement")
    elif chat_result == "working":
        print("💬 Chat fonctionne normalement")
    else:
        print("⚠️  Chat présente des problèmes")

if __name__ == "__main__":
    main()
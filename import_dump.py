#!/usr/bin/env python3
"""Script to import JSON dump data into MongoDB for Greeters CMS"""

import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / 'backend' / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'greeters_cms')

async def import_data(dump_file: str):
    """Import data from JSON dump file to MongoDB"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Read the dump file
    with open(dump_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Connected to MongoDB: {DB_NAME}")
    
    # Import users
    if 'users' in data:
        users = data['users']['rows']
        if users:
            # Drop existing collection
            await db.users.drop()
            # Transform and insert
            for user in users:
                user_doc = {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name'],
                    'password_hash': user['password_hash'],
                    'role': user['role'],
                    'created_by': user.get('created_by'),
                    'created_at': user['created_at']
                }
                await db.users.insert_one(user_doc)
            print(f"Imported {len(users)} users")
    
    # Import sessions
    if 'sessions' in data:
        sessions = data['sessions']['rows']
        if sessions:
            await db.sessions.drop()
            for session in sessions:
                session_doc = {
                    'id': session['id'],
                    'user_id': session['user_id'],
                    'token_hash': session['token_hash'],
                    'expires_at': session['expires_at'],
                    'created_at': session['created_at']
                }
                await db.sessions.insert_one(session_doc)
            print(f"Imported {len(sessions)} sessions")
    
    # Import pages
    if 'pages' in data:
        pages = data['pages']['rows']
        if pages:
            await db.pages.drop()
            for page in pages:
                page_doc = {
                    'id': page['id'],
                    'locale': page.get('locale', 'fr'),
                    'title': page['title'],
                    'slug': page['slug'],
                    'metaDescription': page.get('meta_description'),
                    'metaKeywords': page.get('meta_keywords'),
                    'isInMenu': page.get('is_in_menu', False),
                    'menuOrder': page.get('menu_order', 0),
                    'menuLabel': page.get('menu_label'),
                    'sections': page.get('sections', []),
                    'status': page.get('status', 'published'),
                    'created_by': page.get('created_by'),
                    'created_at': page.get('created_at'),
                    'updated_at': page.get('updated_at')
                }
                await db.pages.insert_one(page_doc)
            print(f"Imported {len(pages)} pages")
    
    # Import AI chat sessions
    if 'ai_chat_sessions' in data:
        ai_sessions = data['ai_chat_sessions']['rows']
        if ai_sessions:
            await db.ai_chat_sessions.drop()
            for session in ai_sessions:
                session_doc = {
                    'id': session['id'],
                    'created_by': session['created_by'],
                    'locale': session.get('locale', 'fr'),
                    'title': session.get('title'),
                    'latest_draft': session.get('latest_draft'),
                    'created_at': session['created_at'],
                    'updated_at': session.get('updated_at', session['created_at'])
                }
                await db.ai_chat_sessions.insert_one(session_doc)
            print(f"Imported {len(ai_sessions)} AI chat sessions")
    
    # Import AI chat messages
    if 'ai_chat_messages' in data:
        ai_messages = data['ai_chat_messages']['rows']
        if ai_messages:
            await db.ai_chat_messages.drop()
            for msg in ai_messages:
                msg_doc = {
                    'id': msg['id'],
                    'session_id': msg['session_id'],
                    'role': msg['role'],
                    'content': msg['content'],
                    'generated_page': msg.get('generated_page'),
                    'created_at': msg['created_at']
                }
                await db.ai_chat_messages.insert_one(msg_doc)
            print(f"Imported {len(ai_messages)} AI chat messages")
    
    # Create indexes
    await db.users.create_index('email', unique=True)
    await db.users.create_index('id', unique=True)
    await db.pages.create_index([('locale', 1), ('slug', 1)])
    await db.pages.create_index([('locale', 1), ('status', 1)])
    await db.pages.create_index('id', unique=True)
    await db.sessions.create_index('user_id')
    await db.sessions.create_index('id', unique=True)
    await db.ai_chat_sessions.create_index('id', unique=True)
    await db.ai_chat_messages.create_index('session_id')
    await db.ai_chat_messages.create_index('id', unique=True)
    
    print("Created indexes")
    
    # Print summary
    print("\n=== Import Summary ===")
    print(f"Users: {await db.users.count_documents({})}")
    print(f"Sessions: {await db.sessions.count_documents({})}")
    print(f"Pages: {await db.pages.count_documents({})}")
    print(f"AI Sessions: {await db.ai_chat_sessions.count_documents({})}")
    print(f"AI Messages: {await db.ai_chat_messages.count_documents({})}")
    
    client.close()
    print("\nImport completed successfully!")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python import_dump.py <dump_file.json>")
        sys.exit(1)
    
    dump_file = sys.argv[1]
    if not os.path.exists(dump_file):
        print(f"Error: File not found: {dump_file}")
        sys.exit(1)
    
    asyncio.run(import_data(dump_file))

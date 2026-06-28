import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from datetime import datetime, timedelta

SCOPES = ['https://www.googleapis.com/auth/calendar.events']

def get_auth_flow():
    client_config = {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI")]
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI")
    )
    return flow

def get_auth_url():
    flow = get_auth_flow()
    auth_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    return auth_url, state

def exchange_code_for_tokens(code: str):
    flow = get_auth_flow()
    flow.fetch_token(code=code)
    credentials = flow.credentials
    return {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
    }

def book_sprint_on_calendar(access_token: str, sprint: dict, start_time: datetime):
    creds = Credentials(token=access_token)
    service = build('calendar', 'v3', credentials=creds)
    end_time = start_time + timedelta(minutes=sprint['duration_minutes'])
    event = {
        'summary': f"🚨 Clutch: {sprint['title']}",
        'description': f"Goal: {sprint['goal']}\n\nPowered by Clutch AI",
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'colorId': '11',
        'reminders': {
            'useDefault': False,
            'overrides': [{'method': 'popup', 'minutes': 5}],
        },
    }
    created_event = service.events().insert(calendarId='primary', body=event).execute()
    return created_event.get('id'), end_time
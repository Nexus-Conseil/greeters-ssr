from datetime import datetime, timezone
import uuid

from pydantic import BaseModel, ConfigDict, Field


class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class ChatMessage(BaseModel):
    session_id: str
    message: str
    language: str = "fr"
    visitor_id: str | None = None


class ChatbotGenerateReplyRequest(BaseModel):
    messageId: str
    mode: str = "draft"


class ChatbotFeedbackRequest(BaseModel):
    sessionId: str
    messageId: str
    feedback: str


class AiPageGeneratorRequest(BaseModel):
    prompt: str
    locale: str | None = "fr"
    sessionId: str | None = None

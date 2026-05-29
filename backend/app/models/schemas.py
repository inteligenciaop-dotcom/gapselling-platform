from typing import Any

from pydantic import BaseModel


class UserOut(BaseModel):
    id: str
    email: str | None = None
    role: str | None = None


class MeResponse(BaseModel):
    user: UserOut
    profile: dict[str, Any] | None = None
    academy: dict[str, Any] | None = None
    tenant_ready: bool = False


class RecentLeadOut(BaseModel):
    id: str
    name: str
    stage: str | None = None
    tag: str | None = None
    created_at: str | None = None
    created_at_label: str | None = None


class DashboardSummaryResponse(BaseModel):
    leads_today: int
    conversions: int
    active_campaigns: int
    total_leads: int
    recent_leads: list[RecentLeadOut]
    ai_active: bool = False
    whatsapp_connected: bool = False
    whatsapp_status: str = "desconectado"
    whatsapp_phone: str | None = None


class CampaignOut(BaseModel):
    id: str
    academy_id: str
    name: str
    description: str | None = None
    tag: str | None = None
    ai_prompt: str | None = None
    active: bool = False
    mode: str = "broadcast"
    opening_message: str | None = None
    follow_up_interval_hours: int = 24
    max_attempts: int = 3
    created_at: str | None = None
    lead_count: int = 0


class CampaignCreate(BaseModel):
    name: str
    tag: str
    description: str | None = None
    ai_prompt: str | None = None
    active: bool = False
    mode: str = "broadcast"
    opening_message: str | None = None
    follow_up_interval_hours: int = 24
    max_attempts: int = 3


class CampaignUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    tag: str | None = None
    ai_prompt: str | None = None
    mode: str | None = None
    opening_message: str | None = None
    follow_up_interval_hours: int | None = None
    max_attempts: int | None = None


class CampaignStatusUpdate(BaseModel):
    active: bool


class CampaignDispatchStatus(BaseModel):
    campaign_id: str
    pending: int
    sent: int
    failed: int
    replied: int
    cancelled: int = 0
    lost: int = 0
    total: int


class CampaignActivateResponse(BaseModel):
    queued: int
    campaign_id: str
    skipped_no_phone: int = 0
    skipped_no_opt_in: int = 0


class LeadTagsResponse(BaseModel):
    tags: list[str]


class WhatsAppStatusResponse(BaseModel):
    configured: bool
    connected: bool
    status: str
    phone: str | None = None
    instance_name: str | None = None
    instance_id: str | None = None
    qr_code: str | None = None
    pairing_code: str | None = None
    provider: str = "evolution"


class ConversationOut(BaseModel):
    id: str
    academy_id: str
    lead_id: str | None = None
    phone: str
    whatsapp_jid: str | None = None
    contact_name: str | None = None
    agent_type: str
    mode: str
    campaign_id: str | None = None
    last_message_at: str | None = None
    created_at: str | None = None


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    direction: str
    sender_type: str
    body: str
    created_at: str | None = None


class SendConversationMessage(BaseModel):
    body: str


class AIAgentProfileOut(BaseModel):
    id: str
    academy_id: str
    agent_type: str
    display_name: str
    system_prompt: str
    enabled: bool


class AIAgentProfileUpdate(BaseModel):
    display_name: str | None = None
    system_prompt: str | None = None
    enabled: bool | None = None


class StudentOut(BaseModel):
    id: str
    academy_id: str
    lead_id: str | None = None
    name: str
    phone: str | None = None
    plan: str | None = None
    modalities: Any = None
    enrolled_at: str | None = None


class StudentCreate(BaseModel):
    name: str
    phone: str | None = None
    plan: str | None = None
    lead_id: str | None = None
    modalities: Any = None

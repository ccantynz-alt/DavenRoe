"""Messaging API routes."""

from fastapi import APIRouter, HTTPException
from app.messaging.engine import MessagingEngine
from app.messaging.channels import ChannelManager

router = APIRouter(prefix="/messaging", tags=["Messaging"])
engine = MessagingEngine()
channels = ChannelManager()


# Conversations
@router.post("/conversations")
async def create_conversation(data: dict):
    conv = engine.create_conversation(**data)
    return conv.to_dict()


@router.get("/conversations")
async def list_conversations(entity_id: str | None = None, user_id: str | None = None, type: str | None = None):
    convs = engine.list_conversations(entity_id=entity_id, user_id=user_id, conv_type=type)
    return {"conversations": [c.to_dict() for c in convs], "total": len(convs)}


@router.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str):
    conv = engine.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv.to_dict()


# Messages
@router.post("/conversations/{conv_id}/messages")
async def send_message(conv_id: str, data: dict):
    msg = engine.send_message(conv_id, **data)
    if not msg:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return msg.to_dict()


@router.get("/conversations/{conv_id}/messages")
async def get_messages(conv_id: str, limit: int = 50):
    msgs = engine.get_messages(conv_id, limit=limit)
    return {"messages": [m.to_dict() for m in msgs], "count": len(msgs)}


@router.get("/conversations/{conv_id}/pinned")
async def get_pinned(conv_id: str):
    msgs = engine.get_pinned(conv_id)
    return {"pinned": [m.to_dict() for m in msgs]}


# Tax correspondence
@router.post("/tax-correspondence")
async def log_tax_correspondence(data: dict):
    conv, msg = engine.log_tax_correspondence(
        entity_id=data.get("entity_id", ""),
        tax_authority=data.get("tax_authority", ""),
        reference=data.get("reference", ""),
        content=data.get("content", ""),
        sender_id=data.get("sender_id", ""),
        sender_name=data.get("sender_name", ""),
        direction=data.get("direction", "inbound"),
    )
    return {"conversation": conv.to_dict(), "message": msg.to_dict()}


# Search
@router.get("/search/{query}")
async def search_messages(query: str, entity_id: str | None = None):
    results = engine.search_messages(query, entity_id)
    return {"results": [m.to_dict() for m in results], "count": len(results)}


# Channels
@router.post("/channels")
async def create_channel(data: dict):
    channel = channels.create(**data)
    return channel.to_dict()


@router.get("/channels")
async def list_channels(user_id: str | None = None, entity_id: str | None = None):
    if entity_id:
        result = channels.list_for_entity(entity_id)
    elif user_id:
        result = channels.list_for_user(user_id)
    else:
        result = list(channels._channels.values())
    return {"channels": [c.to_dict() for c in result]}


@router.post("/channels/setup-defaults")
async def setup_defaults(data: dict):
    defaults = channels.setup_default_channels(data.get("member_ids", []))
    return {"channels": [c.to_dict() for c in defaults]}


# Summary
@router.get("/summary/{user_id}")
async def messaging_summary(user_id: str):
    return engine.summary(user_id)

"""Tests for messaging, scheduling, and integrations hub."""

from app.messaging.engine import MessagingEngine, ConversationType, MessageType
from app.messaging.channels import ChannelManager
from app.scheduling.calendar import AppointmentScheduler, CalendarInvite, AppointmentStatus
from app.integrations.hub import IntegrationsHub, IntegrationStatus


# ── Messaging ────────────────────────────────────────────────

class TestMessaging:
    def test_create_conversation(self):
        engine = MessagingEngine()
        conv = engine.create_conversation(
            title="Acme Tax Discussion", conversation_type="team",
            entity_id="e1", participant_ids=["u1", "u2"],
        )
        assert conv.id
        assert conv.conversation_type == ConversationType.TEAM

    def test_send_and_receive_messages(self):
        engine = MessagingEngine()
        conv = engine.create_conversation(title="Chat", participant_ids=["u1", "u2"])
        engine.send_message(conv.id, sender_id="u1", sender_name="Alice", content="Hi there")
        engine.send_message(conv.id, sender_id="u2", sender_name="Bob", content="Hello!")

        msgs = engine.get_messages(conv.id)
        assert len(msgs) == 2
        assert msgs[0].content == "Hi there"

    def test_list_conversations_by_entity(self):
        engine = MessagingEngine()
        engine.create_conversation(title="A", entity_id="e1")
        engine.create_conversation(title="B", entity_id="e2")
        engine.create_conversation(title="C", entity_id="e1")

        results = engine.list_conversations(entity_id="e1")
        assert len(results) == 2

    def test_tax_correspondence(self):
        engine = MessagingEngine()
        conv, msg = engine.log_tax_correspondence(
            entity_id="e1", tax_authority="ATO",
            reference="ATO-2024-12345", content="Notice of assessment received",
            sender_id="u1", sender_name="ATO", direction="inbound",
        )
        assert conv.tax_authority == "ATO"
        assert msg.tax_reference == "ATO-2024-12345"
        assert msg.message_type == MessageType.TAX_CORRESPONDENCE

    def test_search_messages(self):
        engine = MessagingEngine()
        conv = engine.create_conversation(title="Test")
        engine.send_message(conv.id, sender_id="u1", content="The BAS is due next week")
        engine.send_message(conv.id, sender_id="u2", content="I'll prepare the GST report")

        results = engine.search_messages("BAS")
        assert len(results) == 1

    def test_pin_message(self):
        engine = MessagingEngine()
        conv = engine.create_conversation(title="Test")
        msg = engine.send_message(conv.id, sender_id="u1", content="Important!")
        engine.pin_message(conv.id, msg.id)
        pinned = engine.get_pinned(conv.id)
        assert len(pinned) == 1

    def test_unread_count(self):
        engine = MessagingEngine()
        conv = engine.create_conversation(title="Test", participant_ids=["u1", "u2"])
        engine.send_message(conv.id, sender_id="u2", content="Hey")
        engine.send_message(conv.id, sender_id="u2", content="Are you there?")
        assert engine.unread_count("u1") == 2


class TestChannels:
    def test_create_channel(self):
        mgr = ChannelManager()
        channel = mgr.create(name="general", channel_type="firm_wide", member_ids=["u1", "u2"])
        assert channel.name == "general"

    def test_setup_defaults(self):
        mgr = ChannelManager()
        defaults = mgr.setup_default_channels(["u1", "u2", "u3"])
        assert len(defaults) == 4
        names = [c.name for c in defaults]
        assert "general" in names
        assert "tax-team" in names

    def test_list_for_user(self):
        mgr = ChannelManager()
        mgr.create(name="ch1", member_ids=["u1", "u2"])
        mgr.create(name="ch2", member_ids=["u2", "u3"])
        assert len(mgr.list_for_user("u1")) == 1
        assert len(mgr.list_for_user("u2")) == 2


# ── Scheduling ───────────────────────────────────────────────

class TestScheduling:
    def test_create_appointment(self):
        sched = AppointmentScheduler()
        appt = sched.create(
            title="Tax Planning Meeting",
            appointment_type="client_meeting",
            start_time="2024-06-15T10:00:00",
            duration_minutes=60,
            organizer_id="u1",
            attendee_ids=["u1", "u2"],
            entity_id="e1",
        )
        assert appt.id
        assert appt.end_time == "2024-06-15T11:00:00"

    def test_cancel_appointment(self):
        sched = AppointmentScheduler()
        appt = sched.create(title="Meeting", start_time="2024-06-15T10:00:00")
        assert sched.cancel(appt.id, "Client rescheduled") is True
        assert sched.get(appt.id).status == AppointmentStatus.CANCELLED

    def test_complete_with_action_items(self):
        sched = AppointmentScheduler()
        appt = sched.create(title="Review", start_time="2024-06-15T10:00:00")
        sched.complete(appt.id, ["Prepare BAS", "Send engagement letter"])
        completed = sched.get(appt.id)
        assert completed.status == AppointmentStatus.COMPLETED
        assert len(completed.action_items) == 2

    def test_calendar_invite_ics(self):
        sched = AppointmentScheduler()
        appt = sched.create(
            title="Year-End Review",
            start_time="2024-06-15T10:00:00",
            duration_minutes=90,
            organizer_name="Jane Partner",
            attendee_emails=["client@example.com"],
            video_link="https://zoom.us/j/123456",
        )
        ics = sched.get_calendar_invite(appt.id)
        assert "BEGIN:VCALENDAR" in ics
        assert "Year-End Review" in ics
        assert "VALARM" in ics  # Reminders

    def test_list_for_user(self):
        sched = AppointmentScheduler()
        sched.create(title="A", organizer_id="u1", start_time="2024-06-15T10:00:00")
        sched.create(title="B", attendee_ids=["u1"], start_time="2024-06-16T10:00:00")
        sched.create(title="C", attendee_ids=["u2"], start_time="2024-06-17T10:00:00")
        assert len(sched.list_for_user("u1")) == 2

    def test_availability(self):
        sched = AppointmentScheduler()
        sched.set_availability("u1", {
            "monday": {"start": "09:00", "end": "17:00"},
            "tuesday": {"start": "09:00", "end": "17:00"},
            "blocked_dates": ["2024-12-25"],
        })
        # Monday
        result = sched.get_availability("u1", "2024-06-17")  # Monday
        assert result["available"] is True
        # Blocked date
        result = sched.get_availability("u1", "2024-12-25")
        assert result["available"] is False

    def test_list_for_entity(self):
        sched = AppointmentScheduler()
        sched.create(title="A", entity_id="e1", start_time="2024-06-15T10:00:00")
        sched.create(title="B", entity_id="e1", start_time="2024-06-16T10:00:00")
        sched.create(title="C", entity_id="e2", start_time="2024-06-17T10:00:00")
        assert len(sched.list_for_entity("e1")) == 2


# ── Integrations Hub ─────────────────────────────────────────

class TestIntegrationsHub:
    def test_catalog_loaded(self):
        hub = IntegrationsHub()
        all_integrations = hub.list_all()
        assert len(all_integrations) >= 25

    def test_filter_by_category(self):
        hub = IntegrationsHub()
        video = hub.list_all(category="video_conferencing")
        assert len(video) == 3  # Zoom, Teams, Meet
        tax = hub.list_all(category="tax_authority")
        assert len(tax) == 4  # ATO, IRS, IRD, HMRC

    def test_filter_by_jurisdiction(self):
        hub = IntegrationsHub()
        au = hub.list_all(jurisdiction="AU")
        assert len(au) >= 15  # Most integrations support AU

    def test_connect_integration(self):
        hub = IntegrationsHub()
        result = hub.connect("zoom", "u1")
        assert result["status"] == "connected"
        assert hub.get("zoom").status == IntegrationStatus.CONNECTED

    def test_disconnect(self):
        hub = IntegrationsHub()
        hub.connect("zoom", "u1")
        assert hub.disconnect("zoom") is True
        assert hub.get("zoom").status == IntegrationStatus.NOT_CONNECTED

    def test_list_connected(self):
        hub = IntegrationsHub()
        hub.connect("zoom", "u1")
        hub.connect("slack", "u1")
        connected = hub.get_connected()
        assert len(connected) == 2

    def test_categories(self):
        hub = IntegrationsHub()
        cats = hub.list_categories()
        assert len(cats) >= 8
        cat_names = [c["category"] for c in cats]
        assert "video_conferencing" in cat_names
        assert "tax_authority" in cat_names

    def test_tax_authority_integrations(self):
        hub = IntegrationsHub()
        ato = hub.get("ato_portal")
        assert ato is not None
        assert "AU" in ato.supported_jurisdictions

        irs = hub.get("irs_efile")
        assert irs is not None
        assert "US" in irs.supported_jurisdictions

        ird = hub.get("ird_gateway")
        assert "NZ" in ird.supported_jurisdictions

        hmrc = hub.get("hmrc_mtd")
        assert "GB" in hmrc.supported_jurisdictions

    def test_summary(self):
        hub = IntegrationsHub()
        summary = hub.summary()
        assert summary["total_integrations"] >= 25
        assert summary["connected"] == 0  # Nothing connected yet

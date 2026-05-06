# n8n Event Contract

## NormalizedEvent

```json
{
  "eventId": "string",
  "platform": "telegram | discord | mail",
  "eventType": "message.created | email.received | manual.test",
  "direction": "inbound | outbound",
  "conversationId": "string",
  "senderId": "string",
  "senderName": "string",
  "text": "string",
  "subject": "string | null",
  "timestamp": "string",
  "raw": {}
}
```

## Telegram Example

```json
{
  "event": {
    "eventId": "telegram_demo_1",
    "platform": "telegram",
    "eventType": "message.created",
    "direction": "inbound",
    "conversationId": "demo_chat",
    "senderId": "demo_user",
    "senderName": "Demo User",
    "text": "Kargom 3 gundur gelmedi, destek istiyorum.",
    "subject": null,
    "timestamp": "2026-05-06T13:00:00Z",
    "raw": {}
  }
}
```

## Discord Example

```json
{
  "event": {
    "eventId": "discord_demo_1",
    "platform": "discord",
    "eventType": "message.created",
    "direction": "inbound",
    "conversationId": "support-channel",
    "senderId": "discord_user",
    "senderName": "Discord User",
    "text": "Yeni destek talebi var.",
    "subject": null,
    "timestamp": "2026-05-06T13:05:00Z",
    "raw": {}
  }
}
```

## Mail Example

```json
{
  "event": {
    "eventId": "mail_demo_1",
    "platform": "mail",
    "eventType": "email.received",
    "direction": "inbound",
    "conversationId": "inbox",
    "senderId": "billing@example.com",
    "senderName": "Billing",
    "text": "Odeme tarihiniz 10 Mayis.",
    "subject": "Odeme hatirlatmasi",
    "timestamp": "2026-05-06T13:10:00Z",
    "raw": {}
  }
}
```

## Evaluate Event

`POST /api/agent/evaluate-event`

Response:

```json
{
  "matched": true,
  "taskId": "task_demo_telegram_discord_support",
  "confidence": 0.91,
  "reason": "Mesaj teslimat problemi ve destek talebi iceriyor.",
  "needsApproval": false,
  "action": {
    "type": "send_message",
    "platform": "discord",
    "target": "#destek",
    "text": "Yeni Telegram destek mesaji..."
  }
}
```

## Run Log

`POST /api/runs`

```json
{
  "taskId": "task_demo_telegram_discord_support",
  "eventId": "telegram_demo_1",
  "status": "success",
  "platform": "telegram",
  "actionPlatform": "discord",
  "confidence": 0.91,
  "summary": "Discord mesaji gonderildi.",
  "reason": "n8n action basarili.",
  "details": {}
}
```

## n8n Action Executor

- Telegram connector gelen mesaji NormalizedEvent'e cevirir.
- Discord connector gelen mesaji NormalizedEvent'e cevirir.
- Mail connector gelen maili NormalizedEvent'e cevirir.
- Hepsi backend `/api/agent/evaluate-event` endpointine gider.
- `action.platform=discord` ise Discord mesaj node'u calisir.
- `action.platform=telegram` ise Telegram sendMessage calisir.
- `action.platform=mail` ise mail send calisir.
- Sonuc `/api/runs` endpointine loglanir.

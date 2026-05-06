# AI FlowOps MVP

AI FlowOps, Telegram / Discord / Mail uzerinden gelen mesajlari kullanicinin dogal dilde tanimladigi gorevlerle isleyen hackathon MVP'sidir. Kullanici chat ekranina gorevi yazar, backend Gemini ile task plani uretir, kullanici onaylar, n8n gelen eventleri ortak JSON formatina cevirip backend decision agent endpointine yollar.

Slack bu MVP'de kullanilmiyor. Platformlar: Telegram, Discord, Mail.

## MVP Kapsami

- Dogal dil gorev olusturma: `POST /api/chat`
- Kullanici onayi: `POST /api/tasks/:id/approve`
- n8n event karari: `POST /api/agent/evaluate-event`
- Run log: `POST /api/runs`, `GET /api/runs`
- Dashboard: aktif gorevler, onay bekleyenler, son run kayitlari
- LLM: Google AI Studio Gemini (`gemini-3-flash-preview`)

## Backend

```bash
npm install
cp .env.example .env
npm run dev
```

Backend varsayilan port: `3001`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend varsayilan port: `5173`.

## Env Degiskenleri

Gercek degerleri sadece `.env` icinde tutun. `.env` gitignore icindedir.

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3-flash-preview
MOCK_LLM=false
BACKEND_PORT=3001
N8N_BASE_URL=http://localhost:5678
TELEGRAM_BOT_TOKEN=
DISCORD_BOT_TOKEN=
DISCORD_DEFAULT_CHANNEL_ID=
MAIL_USER=
MAIL_PASSWORD=
```

## Lokal n8n Notu

n8n bir bilgisayarda lokal calisabilir. Diger ekip uyeleri ayni agdan `http://<n8n-ip>:5678` adresine baglanabilir. Production public webhook zorunlu degildir; polling, manual trigger veya connector output MVP icin yeterlidir.

n8n akisi:

1. Telegram / Discord / Mail connector event alir.
2. Event `NormalizedEvent` formatina cevrilir.
3. Backend `/api/agent/evaluate-event` endpointine POST edilir.
4. Backend Gemini decision agent ile action dondurur.
5. n8n action platformuna gore Discord / Telegram / Mail node calistirir.
6. Sonuc `/api/runs` endpointine loglanir.

## Demo Akisi

Chat mesaji:

```text
Telegramdan gelen sikayet mesajlarini Discord destek kanalina gonder.
```

Olusan task:

- Kaynak: `telegram`
- Hedef: `discord`
- Trigger: `triggered`
- Kategori: `Destek`
- Kosul: destek veya sikayet anlami tasiyan Telegram mesajlari
- Aksiyon: Discord `#destek` kanalina mesaj

## Curl Testleri

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Telegramdan gelen sikayet mesajlarini Discord destek kanalina gonder.\"}"
```

```bash
curl -X POST http://localhost:3001/api/agent/evaluate-event \
  -H "Content-Type: application/json" \
  -d "{\"event\":{\"eventId\":\"telegram_demo_1\",\"platform\":\"telegram\",\"eventType\":\"message.created\",\"direction\":\"inbound\",\"conversationId\":\"demo_chat\",\"senderId\":\"demo_user\",\"senderName\":\"Demo User\",\"text\":\"Kargom 3 gundur gelmedi, destek istiyorum.\",\"subject\":null,\"timestamp\":\"2026-05-06T13:00:00Z\",\"raw\":{}}}"
```

```bash
curl -X POST http://localhost:3001/api/runs \
  -H "Content-Type: application/json" \
  -d "{\"taskId\":\"task_demo_telegram_discord_support\",\"eventId\":\"telegram_demo_1\",\"status\":\"success\",\"platform\":\"telegram\",\"actionPlatform\":\"discord\",\"confidence\":0.91,\"summary\":\"Discord mesaji gonderildi.\",\"reason\":\"n8n action basarili.\",\"details\":{}}"
```

## Testler

```bash
npm test
npm --prefix frontend run build
pwsh ./test-api.ps1
```

## Guvenlik

- Token, webhook, bot token ve mail sifresi repo'ya yazilmaz.
- n8n workflow exportlarinda credential varsa export temizlenmeli veya placeholder kullanilmali.
- Paylasilmis demo API keyleri hackathon sonrasinda rotate edilmelidir.

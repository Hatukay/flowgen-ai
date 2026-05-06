# AI FlowOps Architecture

## Summary

AI FlowOps, chat tabanli bir otomasyon planlayici ve n8n event karar katmanidir. MVP uc platformu destekler: Telegram, Discord, Mail.

## Bilesenler

- **Frontend Chat UI:** Kullanici dogal dilde gorev tanimlar, task plan kartini gorur, onaylar ve dashboard run loglarini izler.
- **Backend AI Planner:** `POST /api/chat` ile Gemini task planner promptunu calistirir ve task modelini JSON DB'ye yazar.
- **Approval Layer:** Task `waiting_approval` durumundan kullanici onayi ile `active` durumuna gecer.
- **n8n Connectors:** Telegram, Discord ve Mail connectorleri event alir; lokal n8n yeterlidir.
- **Event Normalizer:** n8n eventleri ortak `NormalizedEvent` sozlesmesine cevirir.
- **AI Decision Agent:** `POST /api/agent/evaluate-event` event + aktif task listesini Gemini'ye verir ve action JSON dondurur.
- **Action Executor:** n8n response action platformuna gore Discord / Telegram / Mail aksiyonunu calistirir.
- **Run Dashboard:** `/api/runs` ile decision ve execution sonucu dashboarda yansir.

## Flow

```text
User Chat
  -> Backend /api/chat
  -> Gemini Task Planner
  -> Task waiting_approval
  -> User Approves
  -> Task active
  -> n8n Connector Event
  -> NormalizedEvent
  -> Backend /api/agent/evaluate-event
  -> Gemini Decision Agent
  -> n8n Action Executor
  -> /api/runs
  -> Dashboard
```

## Data Contracts

- `NormalizedEvent`: platformdan bagimsiz event modeli.
- `Task`: kaynak platform, condition, action, approval ve status bilgisi.
- `RunLog`: event/action sonucunu dashboard icin saklayan log modeli.

## Notes

- Keyword tabanli sikayet siniflandirmasi yoktur; karar LLM decision agent ile anlamsal verilir.
- Slack aktif platform degildir; sadece kullanilmadigini belirtmek icin dokumanda gecmektedir.

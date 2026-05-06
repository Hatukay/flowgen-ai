# AI FlowOps MVP Frontend

Modern SaaS tarzında, demo odaklı React/Vite arayüzü.

## Kurulum

```bash
npm install
npm run dev
```

Varsayılan frontend adresi:

```txt
http://localhost:5173
```

Backend adresi `.env` ile değiştirilebilir:

```txt
VITE_API_BASE_URL=http://localhost:3001
```

Backend kapalıysa UI otomatik olarak mock data ile çalışır.

## Demo Akışı

1. Chat input'una şu mesajı gönder:

```txt
Telegramdan gelen şikayet mesajlarını Slack destek birimine gönder.
```

2. AI plan kartında template seçimini göster:

```txt
telegram_to_slack_complaint
```

3. `Onayla ve Aktifleştir` butonuna bas.
4. Modalda izinleri göster ve onayla.
5. Dashboard'da aktif görev, run kaydı ve AI Test Agent sonucunu göster.

## Backend API

Frontend şu endpointlere göre hazırlandı:

```txt
POST /api/chat
GET  /api/tasks
GET  /api/runs
POST /api/tasks/:id/approve
POST /api/test-task/:id
```

API çağrısı başarısız olursa mock fallback devreye girer.

## Acil Demo Fallback

Bu makinede `npm` yoksa root klasördeki `demo.html` dosyası doğrudan tarayıcıda açılabilir.
Bu dosya bağımlılıksızdır ve aynı chat -> plan -> onay -> dashboard akışını gösterir.

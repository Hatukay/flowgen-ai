# AI FlowOps (FlowGen AI)

AI FlowOps (eski adıyla FlowGen AI), doğal dilde (Türkçe) yazılmış kullanıcı taleplerini algılayarak otomatik olarak n8n iş akışları (workflow) üreten, bunları devreye alan ve yürütülmesini yöneten yeni nesil bir otomasyon platformudur. Claude AI entegrasyonu sayesinde teknik olmayan kullanıcılar bile karmaşık iş süreçlerini anında otomatize edebilir ve sağlanan zaman tasarrufunu gösterge paneli (dashboard) üzerinden takip edebilir.

## 🚀 Başlangıç (Nasıl Çalıştırılır?)

Proje, Backend (Express.js) ve Frontend (Next.js) olmak üzere iki ana bileşenden oluşur.

### 1. Backend Kurulumu
Backend klasörüne gidin (örn. `flowgen-ai/`):
```bash
# Bağımlılıkları yükleyin
npm install

# .env dosyasını oluşturun ve gerekli alanları doldurun
cp .env.example .env

# Geliştirme sunucusunu başlatın (Port: 3001)
npm run dev
```

### 2. Frontend Kurulumu
Frontend klasörüne gidin (örn. `flowgen-web/`):
```bash
# Bağımlılıkları yükleyin
npm install

# .env.local dosyasını oluşturun (NEXT_PUBLIC_API_URL=http://localhost:3001)
# Geliştirme sunucusunu başlatın (Port: 3000)
npm run dev
```

### 3. n8n Entegrasyonu
n8n arayüzüne aşağıdaki adresten erişebilir ve oluşturulan akışları gözlemleyebilirsiniz:
> **n8n Cloud Adresi:** `[BURAYA_N8N_INSTANCE_URL_GELECEK]`

## 💡 Demo Senaryoları & Örnek Prompt'lar

Platformu denerken chat arayüzüne yazabileceğiniz 3 örnek senaryo:

**Senaryo 1: Mesajlaşma Köprüsü (Düşük Karmaşıklık)**
> *"Telegram'daki duyuru kanalımıza gelen mesajları yakalayıp, bizim şirketin Slack workspace'indeki #genel kanalına otomatik ileten bir akış kurar mısın?"*

**Senaryo 2: Günlük Raporlama (Orta Karmaşıklık)**
> *"Her sabah saat 08:00'de Gmail kutumdaki son 24 saate ait okunmamış e-postaları çeksin, Claude ile önemli kısımlarını Türkçe özetlesin ve bana Slack'ten özel mesaj olarak atsın."*

**Senaryo 3: Finansal Takip & Hatırlatma (Yüksek Karmaşıklık)**
> *"Muhasebe veritabanına bağlanıp vadesi 3 günü geçmiş faturaları bulsun. Bu faturaların durumuna göre 3, 7 veya 14 günlük gecikme basamaklarını hesaplayıp müşteriye uygun Türkçe hatırlatma maili atsın. Son olarak da veritabanında hatırlatma atıldı olarak güncellesin."*

## 📂 Proje Yapısı

Genel repo mimarisi aşağıdaki şekildedir:

```text
ai-flowops/
├── src/                    # Backend kaynak kodları
│   ├── controllers/        # Route işleyicileri (chat, runs, tasks, workflow)
│   ├── data/               # File-based DB (db.json)
│   ├── prompts/            # Claude AI için sistem promptları (.md formatında)
│   ├── routes/             # Express route tanımlamaları
│   ├── services/           # Dış servis entegrasyonları (n8n API)
│   ├── utils/              # Yardımcı fonksiyonlar (DB okuma/yazma)
│   └── index.js            # Uygulama giriş noktası ve Express ayarları
├── test-api.ps1            # API uç noktalarını test etmek için PowerShell betiği
├── .env.example            # Örnek çevre değişkenleri dosyası
├── package.json            # Proje bağımlılıkları ve script'ler
└── README.md               # Proje dökümantasyonu
```

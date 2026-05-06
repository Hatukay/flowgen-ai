# AI FlowOps Mimari Dokümantasyonu

Bu belge, AI FlowOps (FlowGen AI) platformunun genel sistem mimarisini ve temel bileşenlerini açıklamaktadır. Sistem, doğal dil girdilerini işleyerek kullanıma hazır n8n otomasyonlarına dönüştüren çok katmanlı bir yapı üzerine inşa edilmiştir.

## Sistem Katmanları

### 1. Frontend Chat UI (React/Vite veya Next.js)
Kullanıcıların sistemle etkileşime geçtiği ana arayüzdür. Doğal dil (Türkçe) kullanılarak istenen otomasyon senaryoları bir sohbet formatında sisteme iletilir. Sohbet arayüzü, oluşturulan iş akışlarının planlarını ve taslaklarını kullanıcıya anında gösterir.

### 2. Backend AI Orchestrator (Express.js)
Sistemin beyni olarak görev yapan arka uç orkestratörüdür. 
- Kullanıcıdan gelen sohbet verisini alır.
- Claude AI (Anthropic) API'si ile entegre çalışarak bu istekleri analiz eder.
- İstekleri yapılandırılmış JSON tabanlı n8n iş akışı şemalarına dönüştürür.
- Tüm süreçlerin veritabanı (db.json) kayıtlarını yönetir.

### 3. Approval Layer (Onay Katmanı)
Yapay zeka tarafından üretilen otomasyonlar, güvenlik ve doğruluk amacıyla doğrudan aktif hale getirilmez. 
Kullanıcı, üretilen akışın taslağını ve adımlarını inceler. Her şey beklenen şekilde ise manuel olarak bir **Onay (Approval)** işlemi gerçekleştirir. Ancak bu onaydan sonra akış aktif duruma geçer ve n8n üzerinde devreye alınır.

### 4. n8n Workflow Templates (n8n İş Akışı Şablonları)
Sistem, yaygın kullanım senaryoları için önceden tanımlanmış 3 temel şablon kullanır:
1. **Mesajlaşma & Bildirim Şablonu:** (Örn: Telegram -> Slack köprüsü)
2. **Periyodik Raporlama & Özetleme Şablonu:** (Örn: Günlük e-posta özetini Slack'ten gönderme)
3. **Veritabanı & İşlem Takibi Şablonu:** (Örn: Vadesi geçen faturalar için otomatik müşteri hatırlatması)

Bu şablonlar, AI'ın sıfırdan bir şeyler uydurmasını engeller ve güvenilir, stabil temel yapılar üzerine parametre yerleştirilmesini sağlar.

### 5. Test Agent (Otomatize Kontrol Aracı)
Kullanıcı bir akışı onaylamadan veya devreye almadan önce, Test Agent devreye girer. Bu otomatik mekanizma şunları doğrular:
- Bir tetikleyici (Trigger) şablonu seçilmiş mi?
- En az bir kaynak ve bir hedef yapılandırılmış mı?
- Sistemde bir onay (approval) döngüsü veya durumu var mı?
- Hata durumunda yeniden deneme (maxAttempts) limiti tanımlanmış mı?
Bu kontroller başarıyla geçilirse, akış güvenli olarak işaretlenir.

### 6. Run Dashboard (Görev Çalışma Paneli)
Sistemdeki tüm görevlerin durumlarının, ne kadar zamandır çalıştıklarının, kaç adımda başarılı olduklarının ve sistemde ne kadarlık bir zaman tasarrufu sağladıklarının gerçek zamanlı olarak izlendiği kontrol panelidir. n8n'den gelen webhook'lar aracılığıyla görev logları sürekli olarak buraya yansıtılır.

---

## Mimari Akış Diyagramı (ASCII Flow)

```text
 +---------------------+          +---------------------------------+
 |                     |          |                                 |
 |  Frontend Chat UI   |  ----->  |     Backend AI Orchestrator     |
 |  (Kullanici İsteği) |          | (Claude API / JSON Donusumu)    |
 |                     |          |                                 |
 +---------------------+          +---------------------------------+
                                                  |
                                                  v
 +---------------------+          +---------------------------------+
 |                     |          |                                 |
 |   Approval Layer    |  <-----  |           Test Agent            |
 |  (Kullanici Onayi)  |          |      (Otomatik Kontroller)      |
 |                     |          |                                 |
 +---------------------+          +---------------------------------+
           |
           v
 +---------------------+          +---------------------------------+
 |                     |          |                                 |
 | n8n Cloud Instance  |  ----->  |          Run Dashboard          |
 | (Aktif İs Akislari) |          |   (Loglar & Gercek Zamanli Iz)  |
 |                     |          |                                 |
 +---------------------+          +---------------------------------+
           |
           +---> (Webhook Geri Bildirimleri)
```

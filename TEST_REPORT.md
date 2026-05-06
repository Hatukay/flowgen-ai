# AI FlowOps (FlowGen AI) - Test Raporu

Bu rapor, AI FlowOps platformunun temel n8n iş akışı senaryoları üzerindeki fonksiyonel test sonuçlarını içermektedir. Testler, platformun belirlediği şablonlara uygun şekilde oluşturulan otomasyonların simülasyon ortamındaki başarı durumlarını göstermektedir.

---

## Test 1: Telegram Şikayet Mesajının Slack Destek Kanalına İletilmesi
**Senaryo:** Telegram webhook tetikleyicisi aracılığıyla gelen bir müşteri şikayetinin, veri dönüşümü yapılarak Slack'teki ilgili destek kanalına iletilmesi.

* **Test Girdisi (Input):** 
  ```json
  {
    "message": {
      "chat_id": "123456789",
      "text": "Sisteminiz son 1 saattir sürekli hata veriyor, giriş yapamıyorum!",
      "username": "angry_user99"
    }
  }
  ```
* **Beklenen Çıktı (Expected Output):** Telegram mesaj formatının Slack block kit formatına çevrilmesi ve `#destek` kanalına "@angry_user99: Sisteminiz son 1 saattir sürekli hata veriyor, giriş yapamıyorum!" şeklinde uyarı mesajının düşmesi.
* **Gerçekleşen Çıktı (Actual Output):** Mesaj Slack block kit formatına başarıyla çevrildi ve hedef `#destek` kanalına belirtilen formatta webhook aracılığıyla iletildi.
* **Durum (Status):** ✅ **PASS**

---

## Test 2: Son 10 Mailin Mock Data ile Özetlenmesi
**Senaryo:** Planlanmış bir görev (schedule) ile mock bir gelen kutusundaki son 10 e-postanın okunması, Claude AI kullanılarak Türkçe madde madde özetlenmesi ve sonucun yöneticiye doğrudan Slack DM üzerinden iletilmesi.

* **Test Girdisi (Input):** 
  Çeşitli konularda (fatura, sistem uyarısı, toplantı hatırlatması vb.) 10 adet farklı mock e-posta içeriği.
* **Beklenen Çıktı (Expected Output):** 10 adet e-postanın içeriğinin analiz edilip, en önemlilerinin üstte olacağı şekilde madde imli (bullet points) Türkçe bir özet metni oluşturulması ve hedeflenen kullanıcıya Slack DM olarak gönderilmesi.
* **Gerçekleşen Çıktı (Actual Output):** Claude API, mock mailleri başarıyla işleyerek 4 maddelik önceliklendirilmiş Türkçe bir özet oluşturdu ve Slack `chat.postMessage` API'si üzerinden yöneticiye DM olarak gönderdi.
* **Durum (Status):** ✅ **PASS**

---

## Test 3: Ödeme Tarihi Çıkarım Testi
**Senaryo:** Veritabanından çekilen vadesi geçmiş faturaya ait verilerin incelenmesi, gecikme süresine göre bir eskalasyon basamağının hesaplanması ve uygun bir hatırlatma formatı oluşturulması.

* **Test Girdisi (Input):** 
  Vadesi `2026-05-01` olan, bugünün tarihi `2026-05-06` (5 gün gecikmiş) olan bir faturanın JSON verisi.
* **Beklenen Çıktı (Expected Output):** Sistemdeki 5 günlük gecikmeyi algılayıp "Seviye 1 (3+ gün)" basamağını seçmesi, uygun müşteri e-postası şablonunu oluşturması ve veritabanındaki `last_reminder_at` alanını güncellemesi.
* **Gerçekleşen Çıktı (Actual Output):** Gecikme basamağı doğru hesaplanıp ("Seviye 1") e-posta şablonu düzgün oluşturuldu; ancak müşteri e-posta adresindeki bir veri tipografisi hatası yüzünden (örn. hatalı e-posta formatı) hedef sisteme (mail sunucusuna) gönderim adımında hata fırlatıldı ve veritabanı güncelleme (update) adımı yarıda kesildi.
* **Durum (Status):** ⚠️ **PARTIAL**

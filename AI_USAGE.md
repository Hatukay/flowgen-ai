# AI Usage

## AI Kullanilan Yerler

- **Gorev planlama:** Kullanici chat mesajindan task JSON modeli uretme.
- **Event/task eslestirme:** NormalizedEvent ile aktif task listesini anlamsal olarak karsilastirma.
- **Action uretimi:** n8n'in calistirabilecegi action JSON'u dondurme.
- **Test raporu destegi:** Task schema ve decision akisi icin kontrol sonuclari uretme.

## Manuel Yapilan Yerler

- n8n connector kurulumu.
- Telegram, Discord ve Mail credential yonetimi.
- Lokal n8n IP paylasimi ve demo platform ayarlari.
- Gercek bot tokenlari ve mail sifreleri.

## Model

- Provider: Google AI Studio Gemini API.
- Varsayilan model: `gemini-3-flash-preview`.
- Env: `GEMINI_API_KEY`, `GEMINI_MODEL`.

## Kalite Notu

Sikayet, odeme tarihi veya CV maili gibi kararlar sabit keyword listesiyle verilmez. Backend event decision agent event ve aktif gorevleri Gemini'ye verir; model kararini anlam iliskisine gore JSON olarak dondurur.

# AI FlowOps Test Report

## Test 1: Telegram Event -> AI Decision -> Discord Action

- Input: Telegram `message.created` NormalizedEvent.
- Expected: Aktif Telegram destek task'i ile eslesir, action platform `discord`, target `#destek`.
- Status: PASS.

## Test 2: Mail Event -> AI Decision

- Input: Mail `email.received` NormalizedEvent.
- Expected: Mail ozet veya odeme task'i ile anlamina gore eslesir ya da guvenli `skipped` dondurur.
- Status: PASS.

## Test 3: Discord Event -> AI Decision

- Input: Discord `message.created` NormalizedEvent.
- Expected: Discord kaynakli aktif task yoksa `matched=false`, run status `skipped`.
- Status: PASS.

## Test 4: Onay Mekanizmasi

- Input: `/api/chat` ile olusan `waiting_approval` task.
- Expected: `/api/tasks/:id/approve` task statusunu `active` yapar ve system run log olusturur.
- Status: PASS.

## Test 5: Run Log Dashboard

- Input: `/api/runs` ve n8n style `/api/runs` POST.
- Expected: Son run kayitlari platform, actionPlatform, confidence, status ve reason ile gorunur.
- Status: PASS.

## Calistirilan Kontroller

- `npm test`
- `npm --prefix frontend run build`
- `pwsh ./test-api.ps1`
- Eski provider ve eski platform kalinti aramasi
- Secret dosyasi kontrolu

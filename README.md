# Auto Boost Mongolia

Монгол хэлтэй AI Ads Manager.

## Зорилго
Facebook / Instagram зар сурталчилгааг Монгол хэлээр, Meta Ads Manager-тэй дүйцэхүйц нарийн тохиргоотой, AI туслахтайгаар удирдах SaaS.

## Үндсэн урсгал
Facebook холбоно → Кампайн → Зарын багц → Зар → AI шалгалт → Урьдчилан харах → Нийтлэх

## Одоогийн боломжууд
- Монгол хэлтэй professional Ads Manager UI
- Кампайн / Зарын багц / Зар 3 шатлал
- Audience, placement, budget, creative нарийн тохиргоо
- AI шалгалт ба зөвлөмжийн panel
- Windsor.ai Facebook Ads integration layer
- Facebook OAuth connect-info endpoint
- Ad account discovery
- Windsor write actions runtime discovery
- Write action execute endpoint
- Facebook Ads reporting endpoint
- Facebook холболтын тусдаа Монгол дэлгэц

## Local ажиллуулах

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
npm install
npm run dev
```

`backend/.env` дотор Windsor API key-ээ тохируулна.

```env
WINDSOR_API_KEY=
WINDSOR_FACEBOOK_ACCOUNT=
```

Frontend: http://localhost:3000
Backend: http://localhost:4000
Facebook холболт: http://localhost:3000/facebook

## Backend Meta endpoint-ууд
- `GET /meta/status`
- `GET /meta/connect-info`
- `GET /meta/accounts`
- `GET /meta/actions`
- `POST /meta/actions/execute`
- `GET /meta/report`

## Аюулгүй ажиллагаа
- Meta/Facebook password системд хадгалахгүй.
- OAuth Windsor.ai-аар дамжина.
- Write action-ийг frontend дээр хэрэглэгчийн баталгаажуулалтын дараа execute хийхээр төлөвлөсөн.
- Production дээр API key-г зөвхөн backend secret хэлбэрээр хадгална.

## Дараагийн шат
- Page/Post жагсаалт
- Existing organic post boost flow
- Campaign → Ad Set → Ad action mapper
- PAUSED → хэрэглэгч батлах → ACTIVE
- Real dashboard metrics
- PostgreSQL/Supabase persistence
- Auth + байгууллага + хэрэглэгчийн эрх

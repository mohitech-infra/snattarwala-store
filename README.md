# SN AttarWala

SN AttarWala is a luxury fragrance storefront for attars, perfumes and bakhoor, built with Next.js App Router, React, Tailwind CSS and Supabase.

## Requirements

- Node.js `24.13.1` (see `.nvmrc`)
- npm 11+
- Supabase credentials for live product, account and order features
- Razorpay credentials for online payments

## Setup

```bash
nvm use
npm ci
cp .env.example .env.local
```

Fill in the required values in `.env.local`. The app has safe defaults for the public WhatsApp CTA, but `NEXT_PUBLIC_WHATSAPP_NUMBER` should be set before deployment.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production mode:

```bash
npm run build
npm run start
```

## Test and checks

The single offline-friendly project check is:

```bash
make test
# or, on Windows without make:
npm test
```

It runs the repository ESLint configuration and the TypeScript typecheck. The production build can be checked separately with `make build`.

## Wholesale section

The homepage now shows a wholesale section directly below the hero, and the same experience is available at `/wholesale`. It includes:

- Golden Series: `₹300` for 12 ml, `₹500` for 24 ml, `₹999` for 55 ml
- Diamond Series: `₹549` for 12 ml, `₹999` for 24 ml, `₹1,999` for 55 ml
- Luxury Series: `₹1,099` for 12 ml, `₹1,899` for 24 ml, `₹2,999` for 55 ml
- Perfume bottle formats: 30 ml, 50 ml and 100 ml, with quote-based pricing
- WhatsApp CTAs with pre-filled messages for each series and bottle size

The wholesale rates are currently static marketing content in `src/components/home/wholesale.tsx`. No database migration is needed for this version. If the pricing needs to be edited from the admin panel later, add a wholesale pricing table and move the component data behind a public read service.

## Deployment

### Docker

```bash
docker build -t sn-attarwala .
docker run --env-file .env.local -p 3000:3000 sn-attarwala
```

### Vercel / Netlify

1. Connect this repository to the hosting provider.
2. Use `npm ci` for install and `npm run build` for the build command.
3. Add the variables from `.env.example` in the provider dashboard.
4. Set the production start command to `npm run start` when using a Node server deployment.

For Supabase auth, add the deployed site URL and auth callback URL in the Supabase dashboard. See `DEPLOYMENT.md` for the existing provider-specific checklist.

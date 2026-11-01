# FirzzPay v1.0 — UI Demo

FirzzPay is a dark-themed digital-wallet interface prototype. Displayed balance and transactions are hard-coded demo data, not real money or a payment ledger.

## Deploy with Vercel
1. Import this repository at https://vercel.com/new.
2. Select Next.js when prompted (after the application files are uploaded).
3. No environment variables are needed for the UI-only demo.

## Safety and payment boundary
This project does not hold, move, or transfer real funds. Top Up, Transfer, and QR Pay are placeholders. Real-money services require an eligible legal business, provider approval, licensed payment partners, server-side secret storage, signed webhook verification, idempotency, reconciliation, fraud controls, and regulatory review. Use provider sandbox credentials only during development. Never collect bank passwords, PINs, OTPs, or card security codes.

## Next milestones
- Add Supabase Auth and row-level security.
- Add a server-side transaction ledger with immutable entries and idempotency.
- Integrate an approved provider sandbox and verify signed webhooks.
- Complete security, compliance, and operational review before any live-money launch.

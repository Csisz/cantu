# Cantu M12 Stripe runbook

Engineering runbook only. It does not imply legal, tax, accounting or commercial approval.

## Modes

- `CANTU_BILLING_MODE=disabled`: Free-only operation; no Checkout or Portal.
- `CANTU_BILLING_MODE=test`: Stripe test data only. Obvious live secret keys are rejected.
- `CANTU_BILLING_MODE=live`: complete live server configuration and manual launch gates are required. Obvious test secret keys are rejected.

Server-only variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_CANTU_PLUS`. `CANTU_PLUS_PRICE_LABEL` controls trusted display copy; it is not an amount submitted by the browser. No value belongs in source control.

## Test-mode setup

1. Create one Stripe Product and recurring Price for Cantu Plus in test mode.
2. Configure the server-only test secret and Price ID.
3. Configure the Stripe Customer Portal separately for test mode.
4. Run the additive Supabase migrations.
5. Forward Stripe events locally:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/billing/webhook
```

The CLI prints a temporary local webhook signing secret. Keep it only in the ignored local environment.

6. Run `npm run readiness` and perform a test-mode purchase.
7. Verify subscription create/update/delete, duplicate delivery, cancellation, Portal return, downgrade and paid-account deletion.

## Pre-live order

1. Finalize business identity, recurring offer and display price.
2. Complete Hungarian/EU counsel, DPA, retention, refund and consumer-rights review.
3. Decide VAT/tax, invoicing and accounting treatment; configure Stripe Tax only if that decision calls for it.
4. Create live Product/Price and configure live Customer Portal.
5. Add the production webhook endpoint and copy its live signing secret.
6. Configure production Supabase/Vercel/Auth/SMTP/contact settings.
7. Run migrations, `npm run readiness:production`, and a controlled test-mode purchase against the production-shaped deployment.
8. Verify webhook, Portal, cancellation and deletion with a disposable paid test account before considering live mode.

Stripe is the subscription lifecycle source of truth. A Checkout success redirect never grants Plus; only verified subscription events update the minimal local mirror.

## Manual launch gates

- professional legal review;
- OpenAI, Supabase, Vercel and Stripe contractual/DPA review;
- tax/VAT/invoicing/accounting decision;
- refund and cancellation wording;
- production domain, contact, Supabase, Vercel and SMTP;
- live Stripe account, Product/Price, Customer Portal and webhook;
- former Higgsfield key rotation if still unresolved.

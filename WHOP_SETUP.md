# Whop Setup

Set these environment variables before switching new checkout traffic to Whop:

```bash
CHECKOUT_PROVIDER=whop
WHOP_API_KEY=...
WHOP_WEBHOOK_SECRET=...
WHOP_PLAN_ID_WEEKLY=plan_...
WHOP_PLAN_ID_YEARLY=plan_...
# Optional if you still want special offer plans in Whop
WHOP_PLAN_ID_FREE_TRIAL=plan_...
WHOP_PLAN_ID_ABANDONED_TRIAL=plan_...
```

Create a Whop webhook that points to:

```text
https://your-domain.com/api/whop/webhook
```

Subscribe it to:

- `membership.activated`
- `membership.deactivated`
- `membership.cancel_at_period_end_changed`

Recommended rollout:

1. Create the weekly and yearly Whop plans first.
2. Add the env vars in Vercel and your local `.env.local`.
3. Deploy the webhook route.
4. Create the webhook in Whop and copy its secret into `WHOP_WEBHOOK_SECRET`.
5. Flip `CHECKOUT_PROVIDER=whop`.
6. Run one live test purchase and confirm the user gets a `subscriptions` row with `billing_provider = whop`.

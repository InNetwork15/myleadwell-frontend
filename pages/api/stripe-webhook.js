// pages/api/stripe-webhook.js

import { buffer } from 'micro';
import Stripe from 'stripe';
import pkg from 'pg';

const { Pool } = pkg;

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let event;
  try {
    const rawBody = await buffer(req);
    const sig = req.headers['stripe-signature'];

    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    console.log('✅ Stripe event received:', event.type);
  } catch (err) {
    console.error('❌ Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const lead_id = parseInt(session.metadata?.lead_id, 10);
    const provider_id = parseInt(session.metadata?.provider_id, 10);
    const job_title = session.metadata?.job_title;
    const payment_intent_id = session.payment_intent;
    const lead_price = session.amount_total / 100;

    try {
      const query = `
        INSERT INTO lead_purchases (
          lead_id, provider_id, job_title, status,
          purchased_at, updated_at, last_updated,
          provider_revenue, payment_intent_id, lead_price
        )
        VALUES (
          $1, $2, $3, 'confirmed',
          NOW(), NOW(), NOW(),
          $4, $5, $4
        )
      `;
      const values = [
        lead_id,
        provider_id,
        job_title,
        lead_price,
        payment_intent_id
      ];

      await pool.query(query, values);

      console.log('✅ Lead purchase recorded for lead:', lead_id);
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('❌ Failed to record purchase in database:', err.message);
      return res.status(500).json({ error: 'Failed to record purchase in database' });
    }
  }

  res.status(200).json({ received: true });
}

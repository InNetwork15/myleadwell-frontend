// pages/api/stripe-webhook.js

import { buffer } from 'micro';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
    console.log('💰 Payment completed for lead:', session.metadata?.lead_id);
    // TODO: Add your DB logic here or trigger an internal API call
  }

  res.status(200).json({ received: true });
}

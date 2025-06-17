import { buffer } from 'micro';
import Stripe from 'stripe';
import db from '../../utils/db'; // Adjust path if needed

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
    const { lead_id, provider_id, job_title } = session.metadata;
    const payment_intent_id = session.payment_intent;

    try {
      // Check for existing purchase
      const existing = await db.query(
        `SELECT id FROM lead_purchases WHERE lead_id = $1 AND provider_id = $2 AND job_title = $3`,
        [lead_id, provider_id, job_title]
      );

      if (existing.rows.length > 0) {
        console.log('🔁 Duplicate lead purchase already exists. Skipping insert.');
        return res.status(200).json({ message: 'Duplicate ignored' });
      }

      // Insert new lead purchase
      await db.query(
        `INSERT INTO lead_purchases (
          lead_id, provider_id, status, purchased_at, job_title,
          payment_intent_id, lead_price
        ) VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
        [
          lead_id,
          provider_id,
          'confirmed',
          job_title,
          payment_intent_id,
          session.amount_total / 100
        ]
      );

      console.log(`✅ Lead ${lead_id} purchased by provider ${provider_id} inserted.`);
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('❌ Error inserting purchase:', err.message);
      return res.status(500).json({ error: 'Failed to record purchase in database' });
    }
  }

  return res.status(200).json({ received: true });
}

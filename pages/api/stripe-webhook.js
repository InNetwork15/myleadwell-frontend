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
    const lead_id = session.metadata?.lead_id;
    const provider_id = session.metadata?.provider_id;
    const job_title = session.metadata?.job_title;

    console.log(`📦 Stripe session completed: lead_id=${lead_id}, provider_id=${provider_id}, job_title=${job_title}`);

    try {
      // 1. Check if this lead/job_title is already purchased
      const existing = await db.query(
        `SELECT 1 FROM lead_purchases WHERE lead_id = $1 AND job_title = $2`,
        [lead_id, job_title]
      );

      if (existing.rowCount > 0) {
        console.log(`⚠️ Duplicate lead purchase for lead_id=${lead_id} and job_title=${job_title}. Skipping insert.`);
        return res.status(200).send(); // Return 200 to stop retries
      }

      // 2. Insert into lead_purchases
      await db.query(
        `INSERT INTO lead_purchases (lead_id, provider_id, job_title, purchased_at, provider_revenue)
         VALUES ($1, $2, $3, NOW(), $4)`,
        [lead_id, provider_id, job_title, 100] // Adjust revenue as needed
      );

      console.log(`✅ Lead purchase recorded for lead_id=${lead_id}, job_title=${job_title}`);
      return res.status(200).send();

    } catch (err) {
      console.error('❌ Error recording lead purchase in DB:', err.message);
      return res.status(500).json({ error: 'Failed to record purchase in database' });
    }
  }

  return res.status(200).json({ received: true });
}

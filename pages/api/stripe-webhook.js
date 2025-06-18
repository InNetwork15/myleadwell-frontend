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

    try {
      // ✅ Check for duplicate
      const existing = await db.query(
        `SELECT 1 FROM lead_purchases WHERE lead_id = $1 AND job_title = $2`,
        [lead_id, job_title]
      );

      if (existing.rowCount > 0) {
        console.log(`⚠️ Lead ${lead_id} already purchased for role ${job_title}. Skipping insert.`);
        return res.status(200).send(); // Prevents Stripe from retrying
      }

      // ✅ Insert purchase record
      const defaultRevenue = 100;
      const providerRevenue = isNaN(Number(session.amount_total)) ? defaultRevenue : Number(session.amount_total) / 100;

      await db.query(
  `INSERT INTO lead_purchases (lead_id, provider_id, job_title, purchased_at, provider_revenue)
   VALUES ($1, $2, $3, NOW(), $4)`,
  [Number(lead_id), Number(provider_id), job_title, providerRevenue]
);

console.log('📝 Inserting purchase:', {
  lead_id,
  provider_id,
  job_title,
  providerRevenue,
});

console.error('❌ DB Error:', err);


      console.log(`✅ Lead purchase recorded: lead ${lead_id}, role ${job_title}`);
      return res.status(200).send();

    } catch (err) {
      console.error('❌ DB Error:', err.message, err.stack);
      return res.status(500).json({ error: 'Failed to record purchase in database' });
    }
  }

  return res.status(200).json({ received: true });
}

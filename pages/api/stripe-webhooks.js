// /pages/api/stripe-webhook.js

import { buffer } from 'micro';
import Stripe from 'stripe';
import { Pool } from 'pg';

export const config = {
  api: { bodyParser: false },
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

const sendEmail = async ({ to, subject, text, html }) => {
  // Optional: forward to your real email handler or use SendGrid/Mailgun
  console.log(`📧 Sending email to ${to} — Subject: ${subject}`);
};

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
    console.error('❌ Stripe signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const lead_id = parseInt(session.metadata?.lead_id || '0', 10);
    const provider_id = parseInt(session.metadata?.provider_id || '0', 10);
    const job_title = session.metadata?.job_title?.trim();
    const payment_intent_id = session.payment_intent;
    const amount_cents = session.amount_total;
    const lead_acquisition_cost = amount_cents / 100;

    if (!lead_id || !provider_id || !job_title) {
      console.error('❌ Missing metadata in session:', { lead_id, provider_id, job_title });
      return res.status(400).send('Missing required metadata');
    }

    try {
      const client = await pool.connect();

      const leadRes = await client.query(
        `SELECT status, affiliate_prices_by_role, role_enabled FROM leads WHERE id = $1`,
        [lead_id]
      );
      const lead = leadRes.rows[0];
      if (!lead || lead.status !== 'pending') {
        client.release();
        return res.status(400).json({ error: 'Lead not available or not found' });
      }

      const existing = await client.query(
        `SELECT 1 FROM lead_purchases WHERE lead_id = $1 AND job_title = $2`,
        [lead_id, job_title]
      );
      if (existing.rowCount > 0) {
        client.release();
        return res.status(409).json({ error: 'Lead already purchased' });
      }

      const affiliatePrice = parseFloat(lead.affiliate_prices_by_role?.[job_title] || 0);

      await client.query(
        `INSERT INTO lead_purchases 
          (lead_id, provider_id, job_title, status, purchased_at, updated_at, last_updated, payment_intent_id, lead_acquisition_cost, affiliate_price)
         VALUES ($1, $2, $3, 'new', NOW(), NOW(), NOW(), $4, $5, $6)
         ON CONFLICT (lead_id, provider_id, job_title)
         DO UPDATE SET
           updated_at = NOW(),
           last_updated = NOW(),
           payment_intent_id = EXCLUDED.payment_intent_id,
           lead_acquisition_cost = EXCLUDED.lead_acquisition_cost,
           affiliate_price = EXCLUDED.affiliate_price`,
        [lead_id, provider_id, job_title, payment_intent_id, lead_acquisition_cost, affiliatePrice]
      );

      await client.query(
        `INSERT INTO lead_payments (lead_id, provider_id, job_title, amount, paid_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [lead_id, provider_id, job_title, lead_acquisition_cost]
      );

      const purchasedRoles = (
        await client.query(`SELECT job_title FROM lead_purchases WHERE lead_id = $1`, [lead_id])
      ).rows.map(r => r.job_title);

      const remainingRoles = Object.entries(lead.role_enabled || {}).filter(
        ([role, enabled]) => enabled && !purchasedRoles.includes(role)
      );

      if (remainingRoles.length === 0) {
        await client.query(`UPDATE leads SET status = 'sold' WHERE id = $1`, [lead_id]);
      }

      const leadMeta = await client.query(
        `SELECT submitted_by, lead_name FROM leads WHERE id = $1`,
        [lead_id]
      );
      const { submitted_by: submitterId, lead_name: fullLeadName = 'your lead' } = leadMeta.rows[0];

      const providerInfo = await client.query(
        `SELECT email, first_name FROM users WHERE id = $1`,
        [provider_id]
      );
      if (providerInfo.rows[0]?.email) {
        await sendEmail({
          to: providerInfo.rows[0].email,
          subject: '🎉 Lead Purchase Confirmation',
          text: `Hi ${providerInfo.rows[0].first_name},\n\nYou purchased the lead: ${fullLeadName}.\n\nLogin to view details.`,
          html: `<p>Hi ${providerInfo.rows[0].first_name},</p><p>You’ve purchased the lead: <strong>${fullLeadName}</strong>.</p>`,
        });
      }

      if (submitterId) {
        const affiliateInfo = await client.query(
          `SELECT email, first_name FROM users WHERE id = $1`,
          [submitterId]
        );
        if (affiliateInfo.rows[0]?.email) {
          await sendEmail({
            to: affiliateInfo.rows[0].email,
            subject: '🚨 Your Lead Was Purchased!',
            text: `Hi ${affiliateInfo.rows[0].first_name},\n\nYour lead (${fullLeadName}) was purchased!`,
            html: `<p>Hi ${affiliateInfo.rows[0].first_name},</p><p>Your lead <strong>${fullLeadName}</strong> was just purchased!</p>`,
          });
        }
      }

      client.release();
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('❌ DB error:', err.message);
      return res.status(500).json({ error: 'Failed to record purchase' });
    }
  }

  return res.status(200).json({ received: true });
}

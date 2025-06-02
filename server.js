const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db');
const sendEmail = require('./utils/email');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/submit-lead', async (req, res) => {
  const lead = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO leads (lead_name, lead_email, lead_phone, state, county, ref, agreed_to_terms, join_network, selected_gift_card) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [lead.lead_name, lead.lead_email, lead.lead_phone, lead.state, lead.county, lead.ref, lead.agreed_to_terms, lead.join_network, lead.selected_gift_card]
    );

    const matchingProviders = await pool.query(
      `
      SELECT email FROM users
      WHERE $1 = ANY(roles)
        AND service_areas @> $2::jsonb
      `,
      ['provider', JSON.stringify([{ state: lead.state, county: lead.county }])]
    );

    for (const user of matchingProviders.rows) {
      await sendEmail(
        user.email,
        '🔔 New Lead Available',
        `A new lead named ${lead.lead_name} has been submitted in ${lead.county, lead.state}.`
      );
    }

    res.status(200).send({ message: 'Lead submitted successfully.' });
  } catch (error) {
    console.error('❌ Error submitting lead:', error);
    res.status(500).send({ error: 'Failed to submit lead.' });
  }
});

app.put('/leads/:id/update', async (req, res) => {
    const { id: leadId } = req.params;
    const { distribution_method, preferred_providers_by_role, role_pricing, role_enabled } = req.body;

    try {
        await pool.query(
            `UPDATE leads 
             SET distribution_method = $1, 
                 preferred_providers_by_role = COALESCE(preferred_providers_by_role, '{}'::jsonb) || $2::jsonb,
                 role_pricing = COALESCE(role_pricing, '{}'::jsonb) || $3::jsonb,
                 role_enabled = COALESCE(role_enabled, '{}'::jsonb) || $4::jsonb
             WHERE id = $5`,
            [
                distribution_method,
                JSON.stringify(preferred_providers_by_role || {}),
                JSON.stringify(role_pricing || {}),
                JSON.stringify(role_enabled || {}),
                leadId
            ]
        );
        if (process.env.NODE_ENV === 'development') {
          console.debug(`✅ Checking lead ${leadId} for user ${req.userId} (${req.job_title})`);
        }
        res.status(200).send({ message: 'Lead updated successfully' });
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).send({ error: 'Failed to update lead' });
    }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
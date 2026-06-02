export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { fullName, nickname, gender, age, contact, inquiry } = data;

  if (!fullName || !contact || !inquiry) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Save to Airtable
  const res = await fetch(
    `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/tblWTu19oGYpAt9wF`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{
          fields: {
            'Full Name': fullName,
            'Nickname': nickname || '',
            'Gender': gender || '',
            'Age': age ? parseInt(age, 10) : null,
            'Contact': contact,
            'Inquiry': inquiry,
            'Submitted At': new Date().toISOString().split('T')[0],
          },
        }],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('Airtable error:', err);
    return new Response(JSON.stringify({ error: 'Failed to save lead', detail: err }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Send confirmation email — non-fatal if it fails
  const isEmail = contact.includes('@');
  if (isEmail) {
    try {
      const firstName = nickname || fullName.split(' ')[0];
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Coach Yassine <onboarding@resend.dev>',
          to: [contact],
          subject: "Your inquiry has been received",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
              <h2 style="color: #ff6a00;">Hey ${firstName},</h2>
              <p>Thanks for reaching out! I've received your inquiry and will get back to you as soon as possible.</p>
              <p>In the meantime, feel free to contact me directly:</p>
              <ul>
                <li>WhatsApp: <a href="https://wa.me/60174213318" style="color: #ff6a00;">+60 17-421 3318</a></li>
                <li>Email: <a href="mailto:my.chelly.contact@gmail.com" style="color: #ff6a00;">my.chelly.contact@gmail.com</a></li>
              </ul>
              <p>Talk soon,<br/><strong>Coach Yassine</strong></p>
            </div>
          `,
        }),
      });
    } catch (emailErr) {
      console.error('Resend error (non-fatal):', emailErr);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

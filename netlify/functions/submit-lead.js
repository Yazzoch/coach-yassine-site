exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { fullName, nickname, gender, age, contact, inquiry } = data;

  if (!fullName || !contact || !inquiry) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const res = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/tblWTu19oGYpAt9wF`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
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
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save lead', detail: err }) };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};

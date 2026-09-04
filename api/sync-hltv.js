module.exports = async (req, res) => {
  try {
    // 1. Получаем матчи напрямую с HLTV API
    const hltvRes = await fetch('https://hltv-api.vercel.app/api/matches.json');
    if (!hltvRes.ok) {
      return res.status(500).json({ error: 'HLTV API Unavailable' });
    }
    const matches = await hltvRes.json();
    const upcoming = matches.slice(0, 10);

    // 2. Подключаем Supabase через REST API без использования пакета @supabase/supabase-js
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials missing in Vercel settings' });
    }

    // Формируем записи для Supabase
    const payload = upcoming.map(m => ({
      id: String(m.id || Math.random()),
      team_a: m.team1?.name || 'TBA',
      team_b: m.team2?.name || 'TBA',
      start_time: m.date ? new Date(m.date).toISOString() : new Date().toISOString()
    }));

    // Записываем данные в базу простым HTTP-запросом
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/matches`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    if (!dbRes.ok) {
      const dbError = await dbRes.text();
      return res.status(500).json({ error: 'Supabase Error', details: dbError });
    }

    return res.status(200).json({ success: true, count: payload.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

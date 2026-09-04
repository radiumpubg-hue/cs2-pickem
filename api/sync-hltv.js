const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  try {
    const response = await fetch('https://hltv-api.vercel.app/api/matches.json');
    const matches = await response.json();

    if (!Array.isArray(matches)) {
      return res.status(500).json({ error: 'Failed to fetch matches from HLTV' });
    }

    const upcoming = matches.slice(0, 10);

    for (const match of upcoming) {
      await supabase.from('matches').upsert({
        id: match.id ? match.id.toString() : Math.random().toString(),
        team_a: match.team1?.name || 'TBA',
        team_b: match.team2?.name || 'TBA',
        start_time: match.date ? new Date(match.date).toISOString() : new Date().toISOString(),
        winner: match.result ? (match.result.team1 > match.result.team2 ? 'team_a' : 'team_b') : null
      }, { onConflict: 'id' });
    }

    return res.status(200).json({ success: true, count: upcoming.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

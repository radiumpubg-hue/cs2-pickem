import { HLTV } from 'hltv';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const matches = await HLTV.getMatches();
    
    // Берем 10 ближайших CS2 матчей
    const upcoming = matches
      .filter(m => m.team1 && m.team2 && m.date)
      .slice(0, 10);

    for (const match of upcoming) {
      await supabase.from('matches').upsert({
        id: match.id.toString(),
        team_a: match.team1.name,
        team_b: match.team2.name,
        start_time: new Date(match.date).toISOString(),
        winner: match.result ? (match.result.team1 > match.result.team2 ? 'team_a' : 'team_b') : null
      }, { onConflict: 'id' });
    }

    return res.status(200).json({ success: true, count: upcoming.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

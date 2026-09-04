module.exports = async function handler(req, res) {
  try {
    const response = await fetch('https://hltv-api.vercel.app/api/matches.json');
    const matches = await response.json();
    return res.status(200).json({ success: true, count: matches.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

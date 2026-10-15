// Vercel serverless function: stores the whole tournament (players, draw, results, times)
// as one JSON document in Upstash Redis.
//   GET  /api/state  -> { state, updatedAt }   (public, read-only)
//   POST /api/state  -> save; needs the organizer password in the "x-admin-key" header
const crypto = require('crypto');

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = process.env.STATE_KEY || 'volta-showdown:state';
const MAX_BYTES = 900 * 1024;

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `Redis error ${res.status}`);
  return data.result;
}

function passwordOk(given) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (!real || typeof given !== 'string') return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

async function readCurrent() {
  const raw = await redis(['GET', KEY]);
  return raw ? JSON.parse(raw) : { state: null, updatedAt: 0 };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(503).json({ error: 'Storage isn’t connected. Add Upstash Redis to this Vercel project, then redeploy.' });
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await readCurrent());
    }

    if (req.method === 'POST') {
      if (!process.env.ADMIN_PASSWORD) {
        return res.status(503).json({ error: 'ADMIN_PASSWORD isn’t set in Vercel. Add it under Settings → Environment Variables, then redeploy.' });
      }
      if (!passwordOk(req.headers['x-admin-key'])) {
        return res.status(401).json({ error: 'Wrong organizer password' });
      }
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      body = body || {};

      if (body.check) return res.status(200).json({ ok: true });

      const state = body.state;
      if (!state || !Array.isArray(state.players) || !Array.isArray(state.draw)) {
        return res.status(400).json({ error: 'That doesn’t look like tournament data.' });
      }

      const current = await readCurrent();
      if ((current.updatedAt || 0) !== (body.base || 0)) {
        // Someone else saved since this browser loaded. Send back the newer copy.
        return res.status(409).json({ error: 'conflict', ...current });
      }

      const next = { state, updatedAt: Date.now() };
      const json = JSON.stringify(next);
      if (Buffer.byteLength(json) > MAX_BYTES) {
        return res.status(413).json({ error: 'The tournament data is too large to save.' });
      }
      await redis(['SET', KEY, json]);
      return res.status(200).json({ updatedAt: next.updatedAt });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

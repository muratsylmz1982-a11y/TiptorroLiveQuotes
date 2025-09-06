const ALLOWED_ORIGINS = [
  // Beispiel: 'https://live.tiptorro.de',
  // Beispiel: 'https://quotes.partner.com',
];

// Wenn noch keine Domains gepflegt sind, alles erlauben (safe default, bricht nichts)
function isAllowedUrl(raw) {
  try {
    const u = new URL(raw);
    if (ALLOWED_ORIGINS.length === 0) return true;
    return ALLOWED_ORIGINS.some(origin => u.origin === origin);
  } catch {
    return false;
  }
}

module.exports = { ALLOWED_ORIGINS, isAllowedUrl };

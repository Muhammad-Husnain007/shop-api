const PASSWORD_KEY = /^(password|passwd|pwd|password_hash|passwordHash|currentPassword|newPassword|confirmPassword)$/i;

export function stripPasswordFields(value) {
  if (Array.isArray(value)) return value.map(stripPasswordFields);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (PASSWORD_KEY.test(key)) continue;
    out[key] = stripPasswordFields(item);
  }
  return out;
}

export function hidePasswords(req, res, next) {
  const json = res.json.bind(res);
  res.json = (body) => json(stripPasswordFields(body));
  next();
}

import mongoose from 'mongoose';
import { captureException } from '@pulse/sdk';
import { userFromRequest } from '@pulse/sdk/express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      ok: false,
      error: err.message,
      details: err.details,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ ok: false, error: err.message });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ ok: false, error: 'Invalid id' });
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ ok: false, error: `${field} already exists` });
  }

  console.error(err);
  captureException(err, {
    url: req.originalUrl || req.url || '',
    extra: { method: req.method, status: 500 },
    user: userFromRequest(req),
  });
  return res.status(500).json({
    ok: false,
    error: env.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
}

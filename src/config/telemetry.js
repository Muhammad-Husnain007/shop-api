let pulse;
let pulseExpress;
let loadError = '';
let initialized = false;

try {
  [pulse, pulseExpress] = await Promise.all([
    import('@pulse/sdk'),
    import('@pulse/sdk/express'),
  ]);
} catch {
  loadError = 'The Pulse SDK package could not be loaded';
  console.warn(`[Pulse] ${loadError}`);
}

export function initTelemetry() {
  if (!pulse) return;
  if (!process.env.PULSE_DSN) {
    console.warn('[Pulse] PULSE_DSN is missing; API errors will not be sent');
    return;
  }
  pulse.init({
    dsn: process.env.PULSE_DSN,
    environment: process.env.PULSE_ENVIRONMENT,
    release: process.env.PULSE_RELEASE,
  });
  initialized = true;
}

export function telemetryStatus() {
  return {
    sdkLoaded: Boolean(pulse),
    dsnConfigured: Boolean(process.env.PULSE_DSN),
    initialized,
    loadError,
  };
}

export function captureException(error, context) {
  pulse?.captureException(error, context);
}

export function userFromRequest(req) {
  return pulseExpress?.userFromRequest?.(req);
}

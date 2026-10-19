let pulse;
let pulseExpress;
let loadError = '';

try {
  [pulse, pulseExpress] = await Promise.all([
    import('@pulse/sdk'),
    import('@pulse/sdk/express'),
  ]);
} catch {
  loadError = 'The Pulse SDK package could not be loaded';
  console.warn(`[Pulse] ${loadError}`);
}

export function telemetryStatus() {
  return {
    sdkLoaded: Boolean(pulse),
    dsnConfigured: Boolean(process.env.PULSE_DSN),
    initialized: Boolean(pulse && process.env.PULSE_DSN),
    loadError,
  };
}

export function captureException(error, context) {
  pulse?.captureException(error, context);
}

export function userFromRequest(req) {
  return pulseExpress?.userFromRequest?.(req);
}

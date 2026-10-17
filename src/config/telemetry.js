let pulse;
let pulseExpress;

try {
  [pulse, pulseExpress] = await Promise.all([
    import('@pulse/sdk'),
    import('@pulse/sdk/express'),
  ]);
} catch {
  // Error reporting is optional; the API must run without the private Pulse SDK.
}

export function initTelemetry() {
  pulse?.init({
    dsn: process.env.PULSE_DSN,
    environment: process.env.PULSE_ENVIRONMENT,
    release: process.env.PULSE_RELEASE,
  });
}

export function captureException(error, context) {
  pulse?.captureException(error, context);
}

export function userFromRequest(req) {
  return pulseExpress?.userFromRequest?.(req);
}

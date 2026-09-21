const BASE = process.env.SHOP_API_URL || 'http://127.0.0.1:4000';
const EMAIL = process.env.SHOP_TEST_EMAIL || 'ali.khan@shop.test';
const PASSWORD = process.env.SHOP_TEST_PASSWORD || 'Test12345!';

async function request(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function waitForApi() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const health = await request('/health');
      if (health.status === 200) return health;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  return null;
}

function fail(message, result) {
  console.error(message);
  if (result) console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

const health = await waitForApi();
if (!health) {
  fail('shop-api is not running. In another terminal: cd shop-api && npm run dev');
}

const login = await request('/api/v1/auth/login', {
  method: 'POST',
  body: { email: EMAIL, password: PASSWORD },
});
if (login.status !== 200 || !login.data.token) {
  fail('Login failed. Run `npm run seed` first, then retry.', login);
}

const token = login.data.token;
const products = await request('/api/v1/products?limit=20');
const product = (products.data.items || []).find((item) => item.stock > 0 && item.isActive !== false);
if (!product) fail('No in-stock product found. Run `npm run seed`.', products);

const productId = String(product.id || product._id);

await request('/api/v1/cart', { method: 'DELETE', token });
const added = await request('/api/v1/cart/items', {
  method: 'POST',
  token,
  body: { productId, quantity: 1 },
});
if (added.status >= 400) fail('Could not add cart item.', added);

const checkout = await request('/api/v1/checkout', {
  method: 'POST',
  token,
  body: {
    shipping: 5,
    address: {
      fullName: 'Ali Khan',
      line1: 'House 1, Street 4',
      city: 'Lahore',
      region: 'Punjab',
      postalCode: '54000',
      country: 'PK',
    },
  },
});
if (checkout.status !== 201 || !checkout.data.checkout) fail('Could not create checkout.', checkout);

const checkoutId = String(checkout.data.checkout.id || checkout.data.checkout._id);
const crashed = await request(`/api/v1/checkout/${checkoutId}/confirm`, {
  method: 'POST',
  token,
  body: { paymentRef: `pay_pulse_${Date.now()}` },
});

if (crashed.status < 500) {
  fail(`Expected a 500 from the planted checkout bug, got ${crashed.status}.`, crashed);
}

console.log('Reproduced critical checkout crash');
console.log(`HTTP ${crashed.status}: ${crashed.data.error || 'Internal server error'}`);
console.log('Bug: confirmCheckout stock loop uses i <= items.length, so the last iteration reads undefined.product');
await new Promise((resolve) => setTimeout(resolve, 1200));
console.log('Open Pulse dashboard: http://127.0.0.1:5173');
console.log('The issue should appear, and the agent should start tracing checkout.service.js.');

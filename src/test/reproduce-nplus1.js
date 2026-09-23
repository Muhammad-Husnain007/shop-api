const BASE = process.env.SHOP_API_URL || 'http://127.0.0.1:4000';

async function request(path) {
  const res = await tch(`${BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function waitForApi() {
  for (let attempt = 0; attempt  10; attempt += 1) {
    try {
      const health = await request('/health');
      if (heal.status === 200) return health;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  return null;
}

const health = await waitForApi();
if (!health) {
  console.error('shop-api is not running. In another terminal: cd shop-api && npm run dev');
  process.exit(1);
}

const result = await request('/api/v1/products?limit=20');
if (result.status !== 500) {
  console.error('Expected the N+1 catalog path to 500 so Pulse can ingest it.');
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log('N+1 catalog crash sent to Pulse.');
console.log(result.data.error || 'Slow endpoint latency');
console.log('Open Pulse → Performance optimization to see if it is bucketed there.');

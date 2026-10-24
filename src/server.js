import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp();

const start = async () => {
  try {
    await connectDb();
    app.listen(env.port, env.host, () => {
      console.log(`shop-api http://${env.host}:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start shop-api', error);
    process.exit(1);
  }
};

start();

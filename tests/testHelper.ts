import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { getSeedData } from '../server/db/seedData.js';

export const TEST_DB_PATH = path.resolve(process.cwd(), 'data', 'test_runner_db.json');

export interface TestContext {
  server: http.Server;
  baseUrl: string;
  close: () => Promise<void>;
  request: (endpoint: string, options?: RequestInit) => Promise<{ status: number; body: any; headers: Headers }>;
}

export async function setupTestEnvironment(): Promise<TestContext> {
  // Ensure isolated test database
  process.env.DB_FILE = 'data/test_runner_db.json';
  process.env.JWT_SECRET = 'technova-test-secret-key-2026';

  // Seed fresh test database
  const seedState = getSeedData();
  // Ensure manager role for Sneha Rao in seed data
  const sneha = seedState.users.find(u => u.email === 'sneha.rao@technova.io');
  if (sneha) sneha.role = 'manager';

  fs.writeFileSync(TEST_DB_PATH, JSON.stringify(seedState, null, 2), 'utf-8');

  // Dynamic import of createApiApp so it loads with process.env.DB_FILE configured
  const { createApiApp } = await import('../server/createApp.js');
  const app = createApiApp();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const request = async (endpoint: string, options: RequestInit = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, { ...options, headers });
    let body: any;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }
    return {
      status: res.status,
      body,
      headers: res.headers,
    };
  };

  const close = async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (e) {
        // ignore cleanup error
      }
    }
  };

  return { server, baseUrl, close, request };
}

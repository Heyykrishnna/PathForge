#!/usr/bin/env node

const baseUrl = (process.env.API_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '');

async function runSmokeTests() {
  let passed = 0;
  let failed = 0;

  async function check(name, testFn) {
    process.stdout.write(`Checking: ${name}... `);
    try {
      await testFn();
      process.stdout.write('PASSED\n');
      passed++;
    } catch (error) {
      process.stdout.write(`FAILED: ${error.message}\n`);
      failed++;
    }
  }

  await check('Health endpoint reports healthy database connectivity', async () => {
    const res = await fetch(`${baseUrl}/health`);
    if (!res.ok) throw new Error(`Status was ${res.status}`);
    const json = await res.json();
    if (json.data?.status !== 'healthy') throw new Error(`Unexpected status ${json.data?.status}`);
    if (json.data?.services?.database !== 'connected') throw new Error('Database is not connected');
  });

  await check('Security headers enforced by Helmet', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const nosniff = res.headers.get('x-content-type-options');
    if (nosniff !== 'nosniff') throw new Error('Missing x-content-type-options header');
    const xss = res.headers.get('x-frame-options');
    if (!xss && !res.headers.get('content-security-policy')) throw new Error('Missing frame protection');
  });

  await check('Unauthorized request to protected endpoint rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/dashboard/overview`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const json = await res.json();
    if (json.error?.code !== 'UNAUTHORIZED') throw new Error(`Expected UNAUTHORIZED code, got ${json.error?.code}`);
  });

  await check('Invalid payload on registration rejected with 400 VALIDATION_ERROR', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email', password: '123' })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const json = await res.json();
    if (json.error?.code !== 'VALIDATION_ERROR') throw new Error(`Expected VALIDATION_ERROR, got ${json.error?.code}`);
    if (!Array.isArray(json.error?.details) || json.error.details.length === 0) {
      throw new Error('Expected field-level validation details');
    }
  });

  await check('Non-existent API route returns 404 NOT_FOUND', async () => {
    const res = await fetch(`${baseUrl}/unknown-non-existent-endpoint`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  console.log(`\nSmoke Test Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error('Smoke test runner failed:', err);
  process.exit(1);
});


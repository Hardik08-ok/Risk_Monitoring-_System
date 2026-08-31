#!/usr/bin/env node
/**
 * TerraGuard AI - Quick verification script
 * Run: node verify.js
 */
const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('\n🔍 TerraGuard AI — Backend Verification\n');
  const endpoints = [
    '/api/health',
    '/api/regions',
    '/api/risk/all',
    '/api/alerts',
    '/api/sensors',
    '/api/reports',
  ];

  let passed = 0;
  for (const ep of endpoints) {
    try {
      const { status, body } = await get(`http://localhost:5000${ep}`);
      const ok = status === 200;
      console.log(`${ok ? '✅' : '❌'} ${ep.padEnd(22)} → ${status} | ${body.count !== undefined ? body.count + ' records' : body.status || 'ok'}`);
      if (ok) passed++;
    } catch (e) {
      console.log(`❌ ${ep.padEnd(22)} → FAILED (is backend running?)`);
    }
  }
  console.log(`\n${passed}/${endpoints.length} endpoints verified\n`);
}

verify();

#!/usr/bin/env node
// proxy-example.js — minimal CORS-relay for local browser use.
//
// When your LLM provider blocks browser-origin requests (CORS), run this
// proxy on your machine and point the app's "代理地址" at it.
//
// Usage:
//   node proxy-example.js
//   UPSTREAM_BASE=https://api.MiniMax.chat/v1 PORT=8787 node proxy-example.js
//
// Then in the app: enable "使用本地代理", set proxyUrl to
// http://localhost:8787/v1.
//
// All request paths and bodies are forwarded to UPSTREAM_BASE as-is.
// Auth headers from the browser are passed through unchanged.

const http = require('node:http');
const { URL } = require('node:url');

const UPSTREAM_BASE = process.env.UPSTREAM_BASE || 'https://api.MiniMax.chat/v1';
const PORT = Number(process.env.PORT || 8787);

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
    });
    return res.end();
  }

  const target = new URL(req.url, UPSTREAM_BASE);
  const headers = { ...req.headers, host: target.host };
  // node fetch on undici uses different casing; keep generic.
  delete headers['content-length']; // will be set by fetch

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      ...Object.fromEntries(upstream.headers),
      'access-control-allow-origin': '*',
    });
    res.end(buf);
  } catch (err) {
    res.writeHead(502, {
      'content-type': 'text/plain',
      'access-control-allow-origin': '*',
    });
    res.end(`Proxy error: ${err.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`proxy-example.js listening on http://localhost:${PORT}`);
  console.log(`forwarding to ${UPSTREAM_BASE}`);
});

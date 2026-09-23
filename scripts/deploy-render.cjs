/**
 * Render Deployment Trigger Script
 * 
 * Supports:
 * 1. Render Deploy Hook URL (GET or POST):
 *    node scripts/deploy-render.cjs https://api.render.com/deploy/srv-xxxx?key=yyyy
 *    OR set RENDER_DEPLOY_HOOK_URL in environment.
 * 
 * 2. Render REST API (with API Key & Service ID):
 *    RENDER_API_KEY=rnd_xxx RENDER_SERVICE_ID=srv-xxx node scripts/deploy-render.cjs
 */

const https = require('https');

async function triggerDeploy() {
  const deployHookUrl = process.argv[2] || process.env.RENDER_DEPLOY_HOOK_URL;
  const apiKey = process.env.RENDER_API_KEY;
  const serviceId = process.env.RENDER_SERVICE_ID;

  if (deployHookUrl) {
    console.log('🚀 Triggering deployment via Render Deploy Hook...');
    return postToUrl(deployHookUrl);
  }

  if (apiKey && serviceId) {
    console.log(`🚀 Triggering deployment via Render REST API for service: ${serviceId}...`);
    return callRenderApi(serviceId, apiKey);
  }

  console.error('❌ Error: Missing deployment configuration.');
  console.log('\nUsage Options:');
  console.log('  1. Deploy Hook:');
  console.log('     node scripts/deploy-render.cjs https://api.render.com/deploy/srv-xxxx?key=yyyy');
  console.log('     (or set RENDER_DEPLOY_HOOK_URL in your .env)');
  console.log('\n  2. Render REST API:');
  console.log('     set RENDER_API_KEY=rnd_xxxx');
  console.log('     set RENDER_SERVICE_ID=srv-xxxx');
  console.log('     node scripts/deploy-render.cjs');
  process.exit(1);
}

function postToUrl(hookUrl) {
  const url = new URL(hookUrl);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'User-Agent': 'TruckTracker-Deployer/1.0'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`✅ Status: ${res.statusCode} ${res.statusMessage}`);
      console.log('📦 Response:', data || '(empty)');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('🎉 Deploy triggered successfully on Render!');
      } else {
        console.error('⚠️ Deploy request returned non-2xx status code.');
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
  });

  req.end();
}

function callRenderApi(serviceId, apiKey) {
  const options = {
    hostname: 'api.render.com',
    port: 443,
    path: `/v1/services/${serviceId}/deploys`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'TruckTracker-Deployer/1.0'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`✅ Status: ${res.statusCode} ${res.statusMessage}`);
      try {
        const json = JSON.parse(data);
        console.log('📦 Deploy Details:', JSON.stringify(json, null, 2));
      } catch {
        console.log('📦 Response:', data);
      }
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('🎉 Deploy successfully initiated via Render REST API!');
      } else {
        console.error('⚠️ Deploy request failed.');
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
  });

  req.write(JSON.stringify({ clearCache: 'do_not_clear' }));
  req.end();
}

triggerDeploy();

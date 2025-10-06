/**
 * Environment Check Script
 * Verifies that all required services are running before load testing
 */

const http = require('http');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const checks = {
  websocket: false,
  redis: false,
  backend: false,
};

// Check if WebSocket server is running
async function checkWebSocketServer() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8081,
      path: '/health',
      method: 'GET',
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ WebSocket server is running on port 8081');
        checks.websocket = true;
        resolve(true);
      } else {
        console.log('❌ WebSocket server responded with status:', res.statusCode);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log('❌ WebSocket server is not running on port 8081');
      console.log('   Start it with: cd backend-ws && npm start');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ WebSocket server health check timed out');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Check if Redis is running
async function checkRedis() {
  try {
    const { stdout } = await execPromise('redis-cli ping');
    if (stdout.trim() === 'PONG') {
      console.log('✅ Redis is running');
      checks.redis = true;
      return true;
    } else {
      console.log('❌ Redis is not responding correctly');
      return false;
    }
  } catch (error) {
    console.log('❌ Redis is not running');
    console.log('   Start it with: redis-server');
    return false;
  }
}

// Check if .NET backend is running
async function checkBackend() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/marketdata/health',
      method: 'GET',
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        // 404 is ok if health endpoint doesn't exist
        console.log('✅ .NET backend is running on port 5000');
        checks.backend = true;
        resolve(true);
      } else {
        console.log('⚠️  .NET backend responded with status:', res.statusCode);
        checks.backend = true; // Still consider it running
        resolve(true);
      }
    });

    req.on('error', (err) => {
      console.log('⚠️  .NET backend is not running on port 5000 (optional for basic tests)');
      console.log('   Start it with: cd backend/StockTracker.API && dotnet run');
      checks.backend = false;
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('⚠️  .NET backend health check timed out');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Main check function
async function checkEnvironment() {
  console.log('🔍 Checking test environment...\n');

  await checkWebSocketServer();
  await checkRedis();
  await checkBackend();

  console.log('\n' + '='.repeat(60));
  console.log('ENVIRONMENT CHECK SUMMARY');
  console.log('='.repeat(60));

  const requiredChecks = checks.websocket && checks.redis;
  const allChecks = requiredChecks && checks.backend;

  if (allChecks) {
    console.log('✅ All services are running - ready for load testing!');
    console.log('\nRun load test with:');
    console.log('  npm run load-test');
    process.exit(0);
  } else if (requiredChecks) {
    console.log('⚠️  Required services are running, but backend is not');
    console.log('   Load test will work but may have limited data');
    console.log('\nRun load test with:');
    console.log('  npm run load-test');
    process.exit(0);
  } else {
    console.log('❌ Required services are not running');
    console.log('\nPlease start the missing services:');
    if (!checks.websocket) {
      console.log('  1. WebSocket server: cd backend-ws && npm start');
    }
    if (!checks.redis) {
      console.log('  2. Redis: redis-server');
    }
    if (!checks.backend) {
      console.log('  3. Backend (optional): cd backend/StockTracker.API && dotnet run');
    }
    process.exit(1);
  }
}

// Run checks
checkEnvironment().catch((error) => {
  console.error('Error checking environment:', error);
  process.exit(1);
});

/**
 * WebSocket Latency Testing Script
 * 
 * This script measures end-to-end latency from backend to frontend:
 * 1. Backend publishes message to Redis
 * 2. WebSocket server receives and broadcasts
 * 3. Client receives the message
 * 
 * Tests under various network conditions and verifies latency < 500ms
 */

import WebSocket from 'ws';
import Redis from 'ioredis';
import { performance } from 'perf_hooks';

// Configuration
const WS_URL = process.env.WS_URL || 'ws://localhost:8081';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const TEST_DURATION_MS = 30000; // 30 seconds
const SAMPLES_PER_SECOND = 2;
const LATENCY_THRESHOLD_MS = 500;

// Network condition simulations
const NETWORK_CONDITIONS = {
  ideal: { delay: 0, jitter: 0, loss: 0 },
  good: { delay: 20, jitter: 5, loss: 0 },
  moderate: { delay: 50, jitter: 15, loss: 1 },
  poor: { delay: 100, jitter: 30, loss: 3 },
  bad: { delay: 200, jitter: 50, loss: 5 }
};

class LatencyTester {
  constructor() {
    this.redis = null;
    this.ws = null;
    this.latencies = [];
    this.messagesSent = 0;
    this.messagesReceived = 0;
    this.errors = 0;
    this.pendingMessages = new Map();
    this.currentCondition = 'ideal';
  }

  async connect() {
    console.log('🔌 Connecting to Redis and WebSocket...');
    
    // Connect to Redis
    this.redis = new Redis(REDIS_URL);
    await this.redis.ping();
    console.log('✅ Redis connected');

    // Connect to WebSocket
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.on('open', () => {
        console.log('✅ WebSocket connected');
        resolve();
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        reject(error);
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket disconnected');
      });
    });
  }

  handleMessage(data) {
    const receiveTime = performance.now();
    
    try {
      const message = JSON.parse(data.toString());
      
      // Handle connection confirmation
      if (message.type === 'connected') {
        console.log('📡 Connection established, client ID:', message.clientId);
        return;
      }

      // Handle subscription confirmation
      if (message.type === 'subscribed') {
        console.log('✅ Subscribed to:', message.symbols);
        return;
      }

      // Handle price updates
      if (message.type === 'price_update') {
        const messageId = message.data?.messageId;
        
        if (messageId && this.pendingMessages.has(messageId)) {
          const sendTime = this.pendingMessages.get(messageId);
          const latency = receiveTime - sendTime;
          
          this.latencies.push(latency);
          this.messagesReceived++;
          this.pendingMessages.delete(messageId);
          
          // Apply network condition simulation
          const condition = NETWORK_CONDITIONS[this.currentCondition];
          const simulatedLatency = latency + condition.delay + (Math.random() * condition.jitter * 2 - condition.jitter);
          
          if (simulatedLatency > LATENCY_THRESHOLD_MS) {
            console.warn(`⚠️  High latency detected: ${simulatedLatency.toFixed(2)}ms (threshold: ${LATENCY_THRESHOLD_MS}ms)`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error.message);
      this.errors++;
    }
  }

  async subscribe(symbols) {
    console.log('📡 Subscribing to symbols:', symbols);
    
    return new Promise((resolve) => {
      const subscribeMessage = JSON.stringify({
        action: 'subscribe',
        symbols: symbols
      });
      
      this.ws.send(subscribeMessage);
      
      // Wait a bit for subscription to be processed
      setTimeout(resolve, 500);
    });
  }

  async publishTestMessage(symbol) {
    const messageId = `test-${Date.now()}-${Math.random()}`;
    const sendTime = performance.now();
    
    this.pendingMessages.set(messageId, sendTime);
    this.messagesSent++;

    const message = JSON.stringify({
      type: 'price_update',
      symbol: symbol,
      data: {
        symbol: symbol,
        price: 2450.50 + Math.random() * 10,
        change: Math.random() * 5 - 2.5,
        changePercent: Math.random() * 2 - 1,
        volume: Math.floor(Math.random() * 1000000),
        timestamp: new Date().toISOString(),
        messageId: messageId,
        source: 'LatencyTest'
      },
      timestamp: new Date().toISOString()
    });

    await this.redis.publish('market-data:updates', message);
  }

  async runTest(condition = 'ideal', duration = TEST_DURATION_MS) {
    console.log(`\n🧪 Running latency test under "${condition}" network conditions...`);
    console.log(`   Duration: ${duration / 1000}s`);
    console.log(`   Samples per second: ${SAMPLES_PER_SECOND}`);
    console.log(`   Network delay: ${NETWORK_CONDITIONS[condition].delay}ms ± ${NETWORK_CONDITIONS[condition].jitter}ms`);
    console.log(`   Packet loss: ${NETWORK_CONDITIONS[condition].loss}%\n`);

    this.currentCondition = condition;
    this.latencies = [];
    this.messagesSent = 0;
    this.messagesReceived = 0;
    this.errors = 0;
    this.pendingMessages.clear();

    const testSymbol = 'LATENCY_TEST';
    await this.subscribe([testSymbol]);

    const interval = 1000 / SAMPLES_PER_SECOND;
    const startTime = Date.now();
    
    const testInterval = setInterval(async () => {
      if (Date.now() - startTime >= duration) {
        clearInterval(testInterval);
        return;
      }

      // Simulate packet loss
      const packetLoss = NETWORK_CONDITIONS[condition].loss;
      if (Math.random() * 100 < packetLoss) {
        // Skip this message to simulate packet loss
        return;
      }

      await this.publishTestMessage(testSymbol);
    }, interval);

    // Wait for test to complete
    await new Promise(resolve => setTimeout(resolve, duration + 2000));

    return this.generateReport(condition);
  }

  generateReport(condition) {
    console.log(`\n📊 Latency Test Report - ${condition.toUpperCase()} Network Conditions`);
    console.log('═'.repeat(70));

    if (this.latencies.length === 0) {
      console.log('❌ No latency measurements collected');
      return {
        condition,
        success: false,
        error: 'No measurements'
      };
    }

    // Calculate statistics
    const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
    const min = sortedLatencies[0];
    const max = sortedLatencies[sortedLatencies.length - 1];
    const avg = sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length;
    const median = sortedLatencies[Math.floor(sortedLatencies.length / 2)];
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
    const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];

    // Apply network condition simulation to statistics
    const networkCondition = NETWORK_CONDITIONS[condition];
    const simulatedAvg = avg + networkCondition.delay;
    const simulatedP95 = p95 + networkCondition.delay + networkCondition.jitter;
    const simulatedP99 = p99 + networkCondition.delay + networkCondition.jitter;

    console.log(`\n📈 Message Statistics:`);
    console.log(`   Messages sent:     ${this.messagesSent}`);
    console.log(`   Messages received: ${this.messagesReceived}`);
    console.log(`   Success rate:      ${((this.messagesReceived / this.messagesSent) * 100).toFixed(2)}%`);
    console.log(`   Errors:            ${this.errors}`);

    console.log(`\n⏱️  Raw Latency (WebSocket only):`);
    console.log(`   Min:     ${min.toFixed(2)}ms`);
    console.log(`   Max:     ${max.toFixed(2)}ms`);
    console.log(`   Average: ${avg.toFixed(2)}ms`);
    console.log(`   Median:  ${median.toFixed(2)}ms`);
    console.log(`   P95:     ${p95.toFixed(2)}ms`);
    console.log(`   P99:     ${p99.toFixed(2)}ms`);

    console.log(`\n🌐 Simulated End-to-End Latency (with network conditions):`);
    console.log(`   Average: ${simulatedAvg.toFixed(2)}ms`);
    console.log(`   P95:     ${simulatedP95.toFixed(2)}ms`);
    console.log(`   P99:     ${simulatedP99.toFixed(2)}ms`);

    // Check if latency meets requirements
    const meetsRequirement = simulatedP95 < LATENCY_THRESHOLD_MS;
    console.log(`\n✅ Requirement Check (P95 < ${LATENCY_THRESHOLD_MS}ms):`);
    console.log(`   Status: ${meetsRequirement ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   P95 Latency: ${simulatedP95.toFixed(2)}ms`);

    // Distribution
    console.log(`\n📊 Latency Distribution:`);
    const buckets = [50, 100, 200, 300, 500, 1000];
    buckets.forEach(bucket => {
      const count = sortedLatencies.filter(l => l < bucket).length;
      const percentage = (count / sortedLatencies.length * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      console.log(`   < ${bucket}ms:  ${bar} ${percentage}%`);
    });

    console.log('\n' + '═'.repeat(70));

    return {
      condition,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      successRate: (this.messagesReceived / this.messagesSent) * 100,
      errors: this.errors,
      raw: {
        min,
        max,
        avg,
        median,
        p95,
        p99
      },
      simulated: {
        avg: simulatedAvg,
        p95: simulatedP95,
        p99: simulatedP99
      },
      meetsRequirement,
      threshold: LATENCY_THRESHOLD_MS
    };
  }

  async disconnect() {
    console.log('\n🔌 Disconnecting...');
    
    if (this.ws) {
      this.ws.close();
    }
    
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

async function main() {
  console.log('🚀 WebSocket Latency Testing Suite');
  console.log('═'.repeat(70));
  console.log(`Target: ${WS_URL}`);
  console.log(`Redis: ${REDIS_URL}`);
  console.log(`Latency Threshold: ${LATENCY_THRESHOLD_MS}ms`);
  console.log('═'.repeat(70));

  const tester = new LatencyTester();
  const results = [];

  try {
    await tester.connect();

    // Test under different network conditions
    const conditions = process.env.TEST_CONDITIONS 
      ? process.env.TEST_CONDITIONS.split(',')
      : ['ideal', 'good', 'moderate', 'poor'];

    for (const condition of conditions) {
      const result = await tester.runTest(condition, TEST_DURATION_MS);
      results.push(result);
      
      // Wait between tests
      if (condition !== conditions[conditions.length - 1]) {
        console.log('\n⏳ Waiting 5 seconds before next test...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Summary
    console.log('\n\n📋 SUMMARY OF ALL TESTS');
    console.log('═'.repeat(70));
    
    results.forEach(result => {
      const status = result.meetsRequirement ? '✅ PASS' : '❌ FAIL';
      console.log(`\n${result.condition.toUpperCase()}:`);
      console.log(`   Status:       ${status}`);
      console.log(`   Success Rate: ${result.successRate.toFixed(2)}%`);
      console.log(`   Avg Latency:  ${result.simulated.avg.toFixed(2)}ms`);
      console.log(`   P95 Latency:  ${result.simulated.p95.toFixed(2)}ms`);
      console.log(`   P99 Latency:  ${result.simulated.p99.toFixed(2)}ms`);
    });

    const allPassed = results.every(r => r.meetsRequirement);
    console.log('\n' + '═'.repeat(70));
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('═'.repeat(70));

    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await tester.disconnect();
  }
}

// Run tests
main().catch(console.error);

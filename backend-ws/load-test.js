/**
 * WebSocket Load Testing Script
 * 
 * This script simulates 100 concurrent WebSocket connections to test:
 * - Message delivery latency
 * - Delivery success rate (target: > 99%)
 * - Memory usage over time
 * - Connection stability
 */

const WebSocket = require('ws');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  WS_URL: process.env.WS_URL || 'ws://localhost:8081',
  NUM_CLIENTS: 100,
  TEST_DURATION_MS: 60000, // 1 minute
  SYMBOLS: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'],
  MEMORY_CHECK_INTERVAL_MS: 5000,
  REPORT_INTERVAL_MS: 10000,
};

// Metrics tracking
const metrics = {
  totalConnections: 0,
  successfulConnections: 0,
  failedConnections: 0,
  totalMessagesSent: 0,
  totalMessagesReceived: 0,
  messageLatencies: [],
  errors: [],
  connectionTimes: [],
  disconnections: 0,
  memorySnapshots: [],
};

// Client class to simulate a WebSocket client
class LoadTestClient {
  constructor(id) {
    this.id = id;
    this.ws = null;
    this.connected = false;
    this.messagesReceived = 0;
    this.messagesSent = 0;
    this.subscriptions = [];
    this.connectTime = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      
      try {
        this.ws = new WebSocket(CONFIG.WS_URL);
        
        this.ws.on('open', () => {
          this.connected = true;
          this.connectTime = performance.now() - startTime;
          metrics.successfulConnections++;
          metrics.connectionTimes.push(this.connectTime);
          console.log(`Client ${this.id}: Connected in ${this.connectTime.toFixed(2)}ms`);
          resolve();
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data);
        });

        this.ws.on('error', (error) => {
          console.error(`Client ${this.id}: Error -`, error.message);
          metrics.errors.push({
            clientId: this.id,
            error: error.message,
            timestamp: Date.now(),
          });
        });

        this.ws.on('close', () => {
          if (this.connected) {
            metrics.disconnections++;
            console.log(`Client ${this.id}: Disconnected`);
          }
          this.connected = false;
        });

        // Connection timeout
        setTimeout(() => {
          if (!this.connected) {
            metrics.failedConnections++;
            reject(new Error(`Connection timeout for client ${this.id}`));
          }
        }, 10000);

      } catch (error) {
        metrics.failedConnections++;
        reject(error);
      }
    });
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      this.messagesReceived++;
      metrics.totalMessagesReceived++;

      // Calculate latency if message has timestamp
      if (message.timestamp) {
        const messageTime = new Date(message.timestamp).getTime();
        const now = Date.now();
        const latency = now - messageTime;
        
        if (latency >= 0 && latency < 60000) { // Sanity check
          metrics.messageLatencies.push(latency);
        }
      }

      // Log sample messages
      if (this.messagesReceived % 100 === 0) {
        console.log(`Client ${this.id}: Received ${this.messagesReceived} messages`);
      }
    } catch (error) {
      console.error(`Client ${this.id}: Failed to parse message -`, error.message);
      metrics.errors.push({
        clientId: this.id,
        error: `Parse error: ${error.message}`,
        timestamp: Date.now(),
      });
    }
  }

  subscribe(symbols) {
    if (!this.connected || !this.ws) {
      console.error(`Client ${this.id}: Cannot subscribe - not connected`);
      return;
    }

    const message = JSON.stringify({
      action: 'subscribe',
      symbols: symbols,
      clientId: `load-test-${this.id}`,
    });

    try {
      this.ws.send(message);
      this.subscriptions = symbols;
      this.messagesSent++;
      metrics.totalMessagesSent++;
      console.log(`Client ${this.id}: Subscribed to ${symbols.join(', ')}`);
    } catch (error) {
      console.error(`Client ${this.id}: Failed to subscribe -`, error.message);
      metrics.errors.push({
        clientId: this.id,
        error: `Subscribe error: ${error.message}`,
        timestamp: Date.now(),
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.connected = false;
    }
  }
}

// Calculate statistics
function calculateStats(values) {
  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0, p95: 0, p99: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

// Memory monitoring
function captureMemorySnapshot() {
  const usage = process.memoryUsage();
  const snapshot = {
    timestamp: Date.now(),
    heapUsed: usage.heapUsed / 1024 / 1024, // MB
    heapTotal: usage.heapTotal / 1024 / 1024, // MB
    external: usage.external / 1024 / 1024, // MB
    rss: usage.rss / 1024 / 1024, // MB
  };
  metrics.memorySnapshots.push(snapshot);
  return snapshot;
}

// Print interim report
function printInterimReport() {
  console.log('\n' + '='.repeat(80));
  console.log('INTERIM REPORT');
  console.log('='.repeat(80));
  
  console.log('\nConnections:');
  console.log(`  Total Attempts: ${metrics.totalConnections}`);
  console.log(`  Successful: ${metrics.successfulConnections}`);
  console.log(`  Failed: ${metrics.failedConnections}`);
  console.log(`  Disconnections: ${metrics.disconnections}`);
  
  console.log('\nMessages:');
  console.log(`  Sent: ${metrics.totalMessagesSent}`);
  console.log(`  Received: ${metrics.totalMessagesReceived}`);
  
  if (metrics.messageLatencies.length > 0) {
    const latencyStats = calculateStats(metrics.messageLatencies);
    console.log('\nLatency (ms):');
    console.log(`  Min: ${latencyStats.min.toFixed(2)}`);
    console.log(`  Max: ${latencyStats.max.toFixed(2)}`);
    console.log(`  Avg: ${latencyStats.avg.toFixed(2)}`);
    console.log(`  Median: ${latencyStats.median.toFixed(2)}`);
    console.log(`  P95: ${latencyStats.p95.toFixed(2)}`);
    console.log(`  P99: ${latencyStats.p99.toFixed(2)}`);
  }
  
  if (metrics.memorySnapshots.length > 0) {
    const latest = metrics.memorySnapshots[metrics.memorySnapshots.length - 1];
    console.log('\nMemory Usage (MB):');
    console.log(`  Heap Used: ${latest.heapUsed.toFixed(2)}`);
    console.log(`  Heap Total: ${latest.heapTotal.toFixed(2)}`);
    console.log(`  RSS: ${latest.rss.toFixed(2)}`);
  }
  
  console.log('\nErrors: ' + metrics.errors.length);
  console.log('='.repeat(80) + '\n');
}

// Print final report
function printFinalReport() {
  console.log('\n' + '='.repeat(80));
  console.log('FINAL LOAD TEST REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📊 CONNECTION METRICS');
  console.log('-'.repeat(80));
  console.log(`Total Connection Attempts: ${metrics.totalConnections}`);
  console.log(`Successful Connections: ${metrics.successfulConnections}`);
  console.log(`Failed Connections: ${metrics.failedConnections}`);
  console.log(`Connection Success Rate: ${((metrics.successfulConnections / metrics.totalConnections) * 100).toFixed(2)}%`);
  console.log(`Disconnections During Test: ${metrics.disconnections}`);
  
  if (metrics.connectionTimes.length > 0) {
    const connStats = calculateStats(metrics.connectionTimes);
    console.log('\nConnection Time Statistics (ms):');
    console.log(`  Min: ${connStats.min.toFixed(2)}`);
    console.log(`  Max: ${connStats.max.toFixed(2)}`);
    console.log(`  Avg: ${connStats.avg.toFixed(2)}`);
    console.log(`  Median: ${connStats.median.toFixed(2)}`);
  }
  
  console.log('\n📨 MESSAGE METRICS');
  console.log('-'.repeat(80));
  console.log(`Total Messages Sent: ${metrics.totalMessagesSent}`);
  console.log(`Total Messages Received: ${metrics.totalMessagesReceived}`);
  
  // Calculate delivery success rate
  // Note: This is an approximation since we're measuring received messages vs expected
  const expectedMessages = metrics.successfulConnections * CONFIG.SYMBOLS.length;
  const deliveryRate = expectedMessages > 0 
    ? (metrics.totalMessagesReceived / expectedMessages) * 100 
    : 0;
  console.log(`Message Delivery Rate: ${deliveryRate.toFixed(2)}%`);
  
  if (metrics.messageLatencies.length > 0) {
    const latencyStats = calculateStats(metrics.messageLatencies);
    console.log('\n⏱️  LATENCY METRICS (ms)');
    console.log('-'.repeat(80));
    console.log(`Samples: ${metrics.messageLatencies.length}`);
    console.log(`Min: ${latencyStats.min.toFixed(2)}`);
    console.log(`Max: ${latencyStats.max.toFixed(2)}`);
    console.log(`Average: ${latencyStats.avg.toFixed(2)}`);
    console.log(`Median: ${latencyStats.median.toFixed(2)}`);
    console.log(`P95: ${latencyStats.p95.toFixed(2)}`);
    console.log(`P99: ${latencyStats.p99.toFixed(2)}`);
    
    // Check if latency meets requirements
    const latencyTarget = 500; // ms
    const meetsLatency = latencyStats.p95 < latencyTarget;
    console.log(`\nLatency Target (P95 < ${latencyTarget}ms): ${meetsLatency ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  console.log('\n💾 MEMORY METRICS');
  console.log('-'.repeat(80));
  if (metrics.memorySnapshots.length > 0) {
    const first = metrics.memorySnapshots[0];
    const last = metrics.memorySnapshots[metrics.memorySnapshots.length - 1];
    const heapGrowth = last.heapUsed - first.heapUsed;
    const rssGrowth = last.rss - first.rss;
    
    console.log(`Initial Heap Used: ${first.heapUsed.toFixed(2)} MB`);
    console.log(`Final Heap Used: ${last.heapUsed.toFixed(2)} MB`);
    console.log(`Heap Growth: ${heapGrowth.toFixed(2)} MB`);
    console.log(`Initial RSS: ${first.rss.toFixed(2)} MB`);
    console.log(`Final RSS: ${last.rss.toFixed(2)} MB`);
    console.log(`RSS Growth: ${rssGrowth.toFixed(2)} MB`);
    
    // Check for potential memory leaks
    const heapGrowthRate = (heapGrowth / first.heapUsed) * 100;
    console.log(`Heap Growth Rate: ${heapGrowthRate.toFixed(2)}%`);
    
    if (heapGrowthRate > 50) {
      console.log('⚠️  WARNING: Significant heap growth detected - potential memory leak');
    }
  }
  
  console.log('\n❌ ERROR METRICS');
  console.log('-'.repeat(80));
  console.log(`Total Errors: ${metrics.errors.length}`);
  console.log(`Error Rate: ${((metrics.errors.length / (metrics.totalMessagesSent + metrics.totalMessagesReceived)) * 100).toFixed(2)}%`);
  
  if (metrics.errors.length > 0 && metrics.errors.length <= 10) {
    console.log('\nError Details:');
    metrics.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. Client ${err.clientId}: ${err.error}`);
    });
  } else if (metrics.errors.length > 10) {
    console.log('\nShowing first 10 errors:');
    metrics.errors.slice(0, 10).forEach((err, idx) => {
      console.log(`  ${idx + 1}. Client ${err.clientId}: ${err.error}`);
    });
  }
  
  console.log('\n✅ TEST RESULTS SUMMARY');
  console.log('-'.repeat(80));
  
  const deliverySuccessRate = expectedMessages > 0 
    ? (metrics.totalMessagesReceived / expectedMessages) * 100 
    : 0;
  const meetsDeliveryTarget = deliverySuccessRate > 99;
  const meetsLatencyTarget = metrics.messageLatencies.length > 0 
    ? calculateStats(metrics.messageLatencies).p95 < 500 
    : false;
  
  console.log(`Connection Success Rate: ${((metrics.successfulConnections / metrics.totalConnections) * 100).toFixed(2)}%`);
  console.log(`Message Delivery Rate: ${deliverySuccessRate.toFixed(2)}% ${meetsDeliveryTarget ? '✅' : '❌'} (Target: > 99%)`);
  console.log(`P95 Latency: ${metrics.messageLatencies.length > 0 ? calculateStats(metrics.messageLatencies).p95.toFixed(2) : 'N/A'}ms ${meetsLatencyTarget ? '✅' : '❌'} (Target: < 500ms)`);
  console.log(`Memory Growth: ${metrics.memorySnapshots.length > 0 ? ((metrics.memorySnapshots[metrics.memorySnapshots.length - 1].heapUsed - metrics.memorySnapshots[0].heapUsed) / metrics.memorySnapshots[0].heapUsed * 100).toFixed(2) : 'N/A'}%`);
  
  const allTestsPassed = meetsDeliveryTarget && meetsLatencyTarget && metrics.failedConnections === 0;
  console.log(`\n${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  console.log('='.repeat(80) + '\n');
}

// Main test execution
async function runLoadTest() {
  console.log('🚀 Starting WebSocket Load Test');
  console.log(`Configuration: ${CONFIG.NUM_CLIENTS} clients, ${CONFIG.TEST_DURATION_MS / 1000}s duration`);
  console.log(`WebSocket URL: ${CONFIG.WS_URL}`);
  console.log(`Test Symbols: ${CONFIG.SYMBOLS.join(', ')}\n`);

  const clients = [];
  
  // Start memory monitoring
  const memoryInterval = setInterval(() => {
    captureMemorySnapshot();
  }, CONFIG.MEMORY_CHECK_INTERVAL_MS);
  
  // Start interim reporting
  const reportInterval = setInterval(() => {
    printInterimReport();
  }, CONFIG.REPORT_INTERVAL_MS);

  try {
    // Phase 1: Connect all clients
    console.log('Phase 1: Connecting clients...');
    for (let i = 0; i < CONFIG.NUM_CLIENTS; i++) {
      const client = new LoadTestClient(i + 1);
      clients.push(client);
      metrics.totalConnections++;
      
      // Stagger connections slightly to avoid overwhelming the server
      if (i % 10 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Connect all clients in parallel
    const connectionPromises = clients.map(client => 
      client.connect().catch(err => {
        console.error(`Failed to connect client ${client.id}:`, err.message);
      })
    );
    
    await Promise.allSettled(connectionPromises);
    console.log(`✅ Connected ${metrics.successfulConnections}/${CONFIG.NUM_CLIENTS} clients\n`);

    // Phase 2: Subscribe to symbols
    console.log('Phase 2: Subscribing to symbols...');
    clients.forEach(client => {
      if (client.connected) {
        // Each client subscribes to all symbols
        client.subscribe(CONFIG.SYMBOLS);
      }
    });
    
    console.log(`✅ Subscriptions sent\n`);

    // Phase 3: Run test for specified duration
    console.log(`Phase 3: Running test for ${CONFIG.TEST_DURATION_MS / 1000} seconds...`);
    console.log('Collecting metrics...\n');
    
    await new Promise(resolve => setTimeout(resolve, CONFIG.TEST_DURATION_MS));

    // Phase 4: Cleanup
    console.log('\nPhase 4: Cleaning up...');
    clearInterval(memoryInterval);
    clearInterval(reportInterval);
    
    clients.forEach(client => client.disconnect());
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Final memory snapshot
    captureMemorySnapshot();

  } catch (error) {
    console.error('Test execution error:', error);
    clearInterval(memoryInterval);
    clearInterval(reportInterval);
  }

  // Print final report
  printFinalReport();
  
  // Exit with appropriate code
  const deliveryRate = metrics.successfulConnections > 0 
    ? (metrics.totalMessagesReceived / (metrics.successfulConnections * CONFIG.SYMBOLS.length)) * 100 
    : 0;
  const success = deliveryRate > 99 && metrics.failedConnections === 0;
  
  process.exit(success ? 0 : 1);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nTest interrupted by user');
  printFinalReport();
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\nTest terminated');
  printFinalReport();
  process.exit(1);
});

// Run the test
runLoadTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

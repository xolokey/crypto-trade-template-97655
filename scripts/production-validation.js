#!/usr/bin/env node

/**
 * Production Validation Script
 * Validates the application is ready for production deployment
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Production Validation...\n');

const checks = [];
let passed = 0;
let failed = 0;

function addCheck(name, fn) {
  checks.push({ name, fn });
}

function runCheck(name, fn) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
      return true;
    } else {
      console.log(`❌ ${name}`);
      failed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
    return false;
  }
}

// Environment Variables Check
addCheck('Environment variables configured', () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PROJECT_ID'
  ];
  
  const envFile = path.join(__dirname, '../.env');
  if (!fs.existsSync(envFile)) {
    throw new Error('.env file not found');
  }
  
  const envContent = fs.readFileSync(envFile, 'utf8');
  return requiredEnvVars.every(envVar => envContent.includes(envVar));
});

// TypeScript Compilation Check
addCheck('TypeScript compilation passes', () => {
  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
});

// Build Process Check
addCheck('Production build succeeds', () => {
  try {
    execSync('npm run build', { stdio: 'pipe' });
    return fs.existsSync(path.join(__dirname, '../dist/index.html'));
  } catch (error) {
    return false;
  }
});

// Package.json Validation
addCheck('Package.json has required scripts', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const requiredScripts = ['build', 'dev', 'type-check', 'lint'];
  return requiredScripts.every(script => packageJson.scripts[script]);
});

// Vercel Configuration Check
addCheck('Vercel configuration exists', () => {
  return fs.existsSync(path.join(__dirname, '../vercel.json'));
});

// Critical Files Check
addCheck('Critical application files exist', () => {
  const criticalFiles = [
    'src/App.tsx',
    'src/services/websocketService.ts',
    'src/services/marketDataService.ts',
    'src/hooks/useRealTimeStock.ts',
    'src/components/realtime/ConnectionStatusIndicator.tsx',
    'backend-ws/server.js'
  ];
  
  return criticalFiles.every(file => fs.existsSync(path.join(__dirname, '..', file)));
});

// Dependencies Check
addCheck('Production dependencies installed', () => {
  return fs.existsSync(path.join(__dirname, '../node_modules'));
});

// Bundle Size Check
addCheck('Bundle size within limits', () => {
  const distPath = path.join(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    return false;
  }
  
  const files = fs.readdirSync(distPath, { recursive: true });
  const jsFiles = files.filter(file => file.endsWith('.js'));
  
  let totalSize = 0;
  jsFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      totalSize += fs.statSync(filePath).size;
    }
  });
  
  // Check if total JS bundle size is under 2MB
  return totalSize < 2 * 1024 * 1024;
});

// Security Check
addCheck('No sensitive data in build', () => {
  const distPath = path.join(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    return false;
  }
  
  const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
  
  // Check for accidentally exposed secrets
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{48}/, // OpenAI API keys
    /AIza[0-9A-Za-z-_]{35}/, // Google API keys (should be in env)
    /postgres:\/\/.*:.*@/, // Database URLs
    /redis:\/\/.*:.*@/ // Redis URLs
  ];
  
  return !sensitivePatterns.some(pattern => pattern.test(indexHtml));
});

// Performance Check
addCheck('Performance optimizations enabled', () => {
  const viteConfig = fs.readFileSync(path.join(__dirname, '../vite.config.ts'), 'utf8');
  return viteConfig.includes('minify') && viteConfig.includes('target');
});

// Run all checks
console.log('Running validation checks...\n');

checks.forEach(({ name, fn }) => {
  runCheck(name, fn);
});

console.log('\n📊 Validation Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All checks passed! Application is ready for production deployment.');
  console.log('\n🚀 Next steps:');
  console.log('1. Deploy to Vercel: vercel --prod');
  console.log('2. Deploy WebSocket server to your hosting provider');
  console.log('3. Deploy .NET backend to your hosting provider');
  console.log('4. Configure monitoring and alerts');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues before deploying to production.');
  console.log('\n🔧 Common fixes:');
  console.log('- Ensure all environment variables are set in .env');
  console.log('- Run npm install to install dependencies');
  console.log('- Fix TypeScript compilation errors');
  console.log('- Optimize bundle size if needed');
  process.exit(1);
}
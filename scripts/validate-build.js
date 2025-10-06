#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const MAX_BUNDLE_SIZE = 1024 * 1024; // 1MB

function validateBuild() {
  console.log('🔍 Validating production build...\n');

  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  // Check for required files
  const requiredFiles = [
    'index.html',
    'assets'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(DIST_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Required file/directory missing: ${file}`);
      process.exit(1);
    }
  }

  // Check bundle sizes
  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = fs.readdirSync(assetsDir);
  
  let totalSize = 0;
  let hasLargeFiles = false;

  files.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeInKB = Math.round(stats.size / 1024);
    totalSize += stats.size;

    console.log(`📦 ${file}: ${sizeInKB}KB`);

    if (stats.size > MAX_BUNDLE_SIZE) {
      console.warn(`⚠️  Large file detected: ${file} (${sizeInKB}KB)`);
      hasLargeFiles = true;
    }
  });

  const totalSizeInKB = Math.round(totalSize / 1024);
  console.log(`\n📊 Total bundle size: ${totalSizeInKB}KB`);

  if (hasLargeFiles) {
    console.warn('\n⚠️  Consider optimizing large files for better performance.');
  }

  // Validate HTML file
  const htmlPath = path.join(DIST_DIR, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  const requiredTags = [
    '<meta name="description"',
    '<meta property="og:title"',
    '<link rel="manifest"',
    'src="/src/main.tsx"'
  ];

  for (const tag of requiredTags) {
    if (!htmlContent.includes(tag)) {
      console.error(`❌ Missing required HTML tag: ${tag}`);
      process.exit(1);
    }
  }

  console.log('\n✅ Build validation passed!');
  console.log('🚀 Ready for deployment to Vercel.');
}

validateBuild();
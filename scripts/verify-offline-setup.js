#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying LEXORA Offline Mode Setup...\n');

const requiredFiles = [
  'public/sw.js',
  'public/manifest.json',
  'lib/offline/indexeddb.ts',
  'lib/offline/network.ts',
  'lib/offline/service-worker.ts',
  'lib/offline/sync-queue.ts',
  'lib/offline/data-sync.ts',
  'components/offline/status-banner.tsx',
  'components/offline/sync-progress.tsx',
  'components/offline/conflict-resolver.tsx',
  'components/providers/offline-provider.tsx',
  'app/offline/page.tsx',
  'app/(authenticated)/settings/offline/page.tsx',
  'app/api/health/route.ts',
  'app/api/sync/route.ts',
  'app/api/sync/[type]/route.ts',
  'app/api/sync/[type]/all/route.ts',
];

const optionalFiles = [
  'public/icon-72x72.png',
  'public/icon-96x96.png',
  'public/icon-128x128.png',
  'public/icon-144x144.png',
  'public/icon-152x152.png',
  'public/icon-192x192.png',
  'public/icon-384x384.png',
  'public/icon-512x512.png',
];

let allGood = true;
let missingOptional = [];

console.log('✅ Checking required files...\n');

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allGood = false;
  }
});

console.log('\n⚠️  Checking optional files (PWA icons)...\n');

optionalFiles.forEach((file) => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} - Missing (not critical)`);
    missingOptional.push(file);
  }
});

console.log('\n' + '='.repeat(60) + '\n');

if (allGood) {
  console.log('✅ All required files are in place!\n');
} else {
  console.log('❌ Some required files are missing. Please check above.\n');
}

if (missingOptional.length > 0) {
  console.log('⚠️  PWA icons are missing. Generate them with:\n');
  console.log('  npx pwa-asset-generator public/logo.png public/ --background "#ffffff" --padding "10%"\n');
  console.log('  Or create them manually and place in public/\n');
}

console.log('📖 Read OFFLINE_MODE_README.md for full setup instructions.\n');
console.log('🧪 Test offline mode:');
console.log('  1. npm run build && npm start');
console.log('  2. Open DevTools → Network → Set to Offline');
console.log('  3. Try using the app\n');

process.exit(allGood ? 0 : 1);

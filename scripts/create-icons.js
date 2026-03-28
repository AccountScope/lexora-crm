#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create simple data URI PNG icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('🎨 Creating placeholder PWA icons...\n');

// Base64 encoded 1x1 blue pixel PNG
const blueSVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1e40af"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="320" font-weight="bold" fill="white" text-anchor="middle">L</text>
</svg>`;

// For each size, create a placeholder
sizes.forEach(size => {
  const filename = path.join(__dirname, '..', 'public', `icon-${size}x${size}.png`);
  
  // Create a simple SVG-based placeholder
  const svgContent = blueSVG.replace('512', size).replace('320', Math.floor(size * 0.625));
  
  // Save as SVG for now (browsers will render it fine)
  const svgFilename = filename.replace('.png', '.svg');
  fs.writeFileSync(svgFilename, svgContent);
  
  console.log(`  ✅ Created ${path.basename(svgFilename)} (SVG)`);
});

// Update manifest.json to use SVG icons
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

manifest.icons = manifest.icons.map(icon => ({
  ...icon,
  src: icon.src.replace('.png', '.svg'),
  type: 'image/svg+xml'
}));

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('\n✅ Updated manifest.json to use SVG icons');
console.log('\n⚠️  Note: These are SVG placeholders. For production, generate PNG icons with:');
console.log('   npx pwa-asset-generator public/logo.png public/ --background "#ffffff"');

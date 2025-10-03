const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'node_modules', 'isomorphic-dompurify', 'node_modules', 'jsdom', 'lib', 'jsdom', 'browser', 'default-stylesheet.css');
const destDir = path.resolve(__dirname, '..', '.next', 'browser');
const dest = path.join(destDir, 'default-stylesheet.css');

try {
  if (!fs.existsSync(src)) {
    console.warn('Source default-stylesheet.css not found at', src);
    process.exit(0);
  }
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('Copied default-stylesheet.css to', dest);
} catch (err) {
  console.error('Failed to copy default-stylesheet.css:', err);
  process.exit(1);
}

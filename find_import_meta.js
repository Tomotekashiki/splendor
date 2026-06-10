const fs = require('fs');
const path = require('path');

const searchDir = path.join(__dirname, 'frontend', 'node_modules');

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === '.bin' || file === '.cache') continue;
    
    let stats;
    try {
      stats = fs.statSync(fullPath);
    } catch (e) {
      continue;
    }

    if (stats.isDirectory()) {
      scan(fullPath);
    } else if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('import.meta')) {
          if (fullPath.includes('postcss') || fullPath.includes('tailwindcss') || fullPath.includes('autoprefixer') || fullPath.includes('vite') || fullPath.includes('unplugin')) {
            console.log(`Found 'import.meta' in: ${fullPath}`);
          }
        }
      } catch (e) {
        // Skip read errors
      }
    }
  }
}

console.log("🔍 Scanning node_modules for 'import.meta'...");
scan(searchDir);
console.log("Done!");

const path = require('path');
const postcss = require(path.join(__dirname, 'frontend', 'node_modules', 'postcss'));
const tailwindConfigPath = path.join(__dirname, 'frontend', 'tailwind.config.js');
const tailwindcss = require(path.join(__dirname, 'frontend', 'node_modules', 'tailwindcss'))(tailwindConfigPath);
const autoprefixer = require(path.join(__dirname, 'frontend', 'node_modules', 'autoprefixer'));

const fs = require('fs');
const cssPath = path.join(__dirname, 'frontend', 'assets', 'css', 'tailwind.css');
const css = fs.readFileSync(cssPath, 'utf8');

console.log("⏳ Running manual PostCSS compilation...");

postcss([tailwindcss, autoprefixer])
  .process(css, { from: 'assets/css/tailwind.css' })
  .then(result => {
    console.log("✅ PostCSS compilation succeeded manually!");
  })
  .catch(err => {
    console.error("\n❌ PostCSS compilation failed with stack trace:");
    console.error(err.stack || err);
  });

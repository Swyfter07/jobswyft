import StyleDictionary from 'style-dictionary';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure dist directory exists
const distPath = resolve(__dirname, '../dist');
mkdirSync(distPath, { recursive: true });

const styleDictionary = StyleDictionary.extend({
  source: [resolve(__dirname, 'tokens/**/*.json')],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: distPath + '/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    js: {
      transformGroup: 'js',
      buildPath: distPath + '/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
        },
      ],
    },
    json: {
      transformGroup: 'js',
      buildPath: distPath + '/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json/flat',
        },
      ],
    },
  },
});

async function build() {
  console.log('🎨 Building design tokens...');
  styleDictionary.buildAllPlatforms();
  console.log('✅ Design tokens built successfully!');

  // Generate theme-aware CSS
  console.log('🎨 Generating theme CSS...');
  await import('./generate-theme-css.js');
}

build();

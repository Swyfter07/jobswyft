import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load token files
const baseColors = JSON.parse(
  readFileSync(resolve(__dirname, 'tokens/colors.json'), 'utf-8')
);
const darkTheme = JSON.parse(
  readFileSync(resolve(__dirname, 'tokens/themes/dark.json'), 'utf-8')
);
const lightTheme = JSON.parse(
  readFileSync(resolve(__dirname, 'tokens/themes/light.json'), 'utf-8')
);
const typography = JSON.parse(
  readFileSync(resolve(__dirname, 'tokens/typography.json'), 'utf-8')
);
const spacing = JSON.parse(
  readFileSync(resolve(__dirname, 'tokens/spacing.json'), 'utf-8')
);
const borders = JSON.parse(
  readFileSync(resolve(__dirname, 'tokens/borders.json'), 'utf-8')
);
const shadows = JSON.parse(
  readFileSync(resolve(__dirname, 'tokens/shadows.json'), 'utf-8')
);
const transitions = JSON.parse(
  readFileSync(resolve(__dirname, 'tokens/transitions.json'), 'utf-8')
);

// Helper to flatten nested objects into CSS variable format
function flattenTokens(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newPrefix = prefix ? `${prefix}-${key}` : key;

    if (value && typeof value === 'object' && 'value' in value) {
      result[newPrefix] = (value as any).value;
    } else if (value && typeof value === 'object') {
      Object.assign(result, flattenTokens(value, newPrefix));
    }
  }

  return result;
}

// Generate CSS content
function generateCSS(): string {
  let css = '/* JobSwyft Design Tokens */\n\n';

  // Root variables (theme-independent)
  css += ':root {\n';
  css += '  /* Base Colors */\n';
  const colors = flattenTokens(baseColors.color);
  for (const [name, value] of Object.entries(colors)) {
    css += `  --color-${name}: ${value};\n`;
  }

  css += '\n  /* Gradients */\n';
  const gradients = flattenTokens(baseColors.gradient);
  for (const [name, value] of Object.entries(gradients)) {
    css += `  --gradient-${name}: ${value};\n`;
  }

  css += '\n  /* Typography */\n';
  const fonts = flattenTokens(typography.font);
  for (const [name, value] of Object.entries(fonts)) {
    css += `  --font-${name}: ${value};\n`;
  }

  css += '\n  /* Spacing */\n';
  const spaces = flattenTokens(spacing.space);
  for (const [name, value] of Object.entries(spaces)) {
    css += `  --space-${name}: ${value};\n`;
  }

  css += '\n  /* Border Radius */\n';
  const radii = flattenTokens(borders.radius);
  for (const [name, value] of Object.entries(radii)) {
    css += `  --radius-${name}: ${value};\n`;
  }

  css += '\n  /* Shadows */\n';
  const shadowTokens = flattenTokens(shadows.shadow);
  for (const [name, value] of Object.entries(shadowTokens)) {
    css += `  --shadow-${name}: ${value};\n`;
  }

  css += '\n  /* Transitions */\n';
  const transitionTokens = flattenTokens(transitions.transition);
  for (const [name, value] of Object.entries(transitionTokens)) {
    css += `  --transition-${name}: ${value};\n`;
  }

  css += '}\n\n';

  // Dark theme (default)
  css += '/* Dark Theme (Default) */\n';
  css += ':root,\n[data-theme="dark"] {\n';
  const darkTokens = flattenTokens(darkTheme.theme.dark);
  for (const [name, value] of Object.entries(darkTokens)) {
    css += `  --theme-${name}: ${value};\n`;
  }
  css += '}\n\n';

  // Light theme
  css += '/* Light Theme */\n';
  css += '[data-theme="light"] {\n';
  const lightTokens = flattenTokens(lightTheme.theme.light);
  for (const [name, value] of Object.entries(lightTokens)) {
    css += `  --theme-${name}: ${value};\n`;
  }
  css += '}\n';

  return css;
}

// Generate and write CSS file
const distPath = resolve(__dirname, '../dist');
const css = generateCSS();
writeFileSync(resolve(distPath, 'themes.css'), css);

console.log('✅ Theme CSS generated successfully!');

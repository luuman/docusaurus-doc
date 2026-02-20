#!/usr/bin/env node
/**
 * Convert GitBook-specific markdown syntax to Docusaurus-compatible equivalents.
 * Run once: node scripts/convert-gitbook.js
 *
 * Files are .md in CommonMark mode — use plain HTML, NOT JSX syntax.
 */
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

// Map GitBook hint styles to Docusaurus admonition types
const HINT_MAP = {
  info: 'note',
  warning: 'warning',
  danger: 'danger',
  success: 'tip',
};

function youtubeEmbed(url) {
  const embedUrl = url
    .replace('https://www.youtube.com/watch?v=', 'https://www.youtube.com/embed/')
    .replace('https://youtu.be/', 'https://www.youtube.com/embed/');
  return [
    '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1.5rem 0">',
    `  <iframe src="${embedUrl}" title="YouTube video"`,
    '    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"',
    '    allowfullscreen',
    '    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"',
    '  ></iframe>',
    '</div>',
  ].join('\n');
}

function convertGitbook(content) {
  let result = content;

  // 1. {% hint style="X" %} ... {% endhint %} → :::type\n...\n:::
  result = result.replace(
    /\{%\s*hint\s+style="(\w+)"\s*%\}([\s\S]*?)\{%\s*endhint\s*%\}/g,
    (_, style, body) => {
      const type = HINT_MAP[style] || 'note';
      return `:::${type}\n${body.trim()}\n:::`;
    }
  );

  // 2. {% embed url="..." %} ... {% endembed %} → iframe HTML
  result = result.replace(
    /\{%\s*embed\s+url="([^"]+)"\s*%\}[\s\S]*?\{%\s*endembed\s*%\}/g,
    (_, url) => youtubeEmbed(url)
  );

  // Fallback: {% embed url="..." %} without endembed
  result = result.replace(
    /\{%\s*embed\s+url="([^"]+)"\s*%\}/g,
    (_, url) => youtubeEmbed(url)
  );

  // 3. {% tabs %} / {% tab title="T" %} / {% endtab %} / {% endtabs %}
  //    → H4 headings (CommonMark .md can't use <Tabs> component)
  result = result.replace(/\{%\s*tabs\s*%\}/g, '');
  result = result.replace(/\{%\s*endtabs\s*%\}/g, '');
  result = result.replace(/\{%\s*tab\s+title="([^"]+)"\s*%\}/g, '\n#### $1\n');
  result = result.replace(/\{%\s*endtab\s*%\}/g, '');

  // 4. {% columns %} / {% column %} / {% endcolumn %} / {% endcolumns %}
  result = result.replace(/\{%\s*columns\s*%\}/g, '');
  result = result.replace(/\{%\s*endcolumns\s*%\}/g, '');
  result = result.replace(/\{%\s*column\s*[^%]*%\}/g, '\n---\n');
  result = result.replace(/\{%\s*endcolumn\s*%\}/g, '');

  // 5. {% code title="..." %} / {% endcode %} → strip wrappers
  result = result.replace(/\{%\s*code\s+[^%]*%\}/g, '');
  result = result.replace(/\{%\s*endcode\s*%\}/g, '');

  // 6. {% file src="..." %} → remove
  result = result.replace(/\{%\s*file\s+[^%]*%\}/g, '');
  result = result.replace(/\{%\s*endfile\s*%\}/g, '');

  // 7. Any remaining {% ... %} → remove
  result = result.replace(/\{%[-\s]*[\w-]+[^%]*%\}/g, '');

  // 8. Fix <figure><img .../></figure> → just the img tag
  result = result.replace(/<figure>([\s\S]*?)<\/figure>/g, (_, inner) => inner.trim());

  return result;
}

function processDir(dir) {
  const entries = fs.readdirSync(dir, {withFileTypes: true});
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const original = fs.readFileSync(fullPath, 'utf-8');
      const converted = convertGitbook(original);
      if (converted !== original) {
        fs.writeFileSync(fullPath, converted, 'utf-8');
        console.log(`✓ ${path.relative(DOCS_DIR, fullPath)}`);
      }
    }
  }
}

console.log('Converting GitBook syntax to Docusaurus format...\n');
processDir(DOCS_DIR);
console.log('\nDone!');

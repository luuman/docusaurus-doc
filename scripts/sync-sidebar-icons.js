#!/usr/bin/env node
/**
 * Reads each doc's frontmatter `icon` field and adds
 * `sidebar_class_name: sidebar-item-icon icon-{icon}` if missing.
 * Run: node scripts/sync-sidebar-icons.js
 */
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check if file has frontmatter
  if (!content.startsWith('---')) return;

  const endIdx = content.indexOf('---', 3);
  if (endIdx === -1) return;

  const frontmatter = content.slice(3, endIdx);
  const body = content.slice(endIdx + 3);

  // Extract icon field
  const iconMatch = frontmatter.match(/^icon:\s*(.+)$/m);
  if (!iconMatch) return;

  const icon = iconMatch[1].trim();

  // Check if sidebar_class_name already exists
  if (/^sidebar_class_name:/m.test(frontmatter)) return;

  // Add sidebar_class_name
  const newFrontmatter = frontmatter.trimEnd() +
    `\nsidebar_class_name: sidebar-item-icon icon-${icon}\n`;

  fs.writeFileSync(filePath, `---${newFrontmatter}---${body}`, 'utf-8');
  console.log(`✓ ${path.relative(DOCS_DIR, filePath)} → icon-${icon}`);
}

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      processFile(fullPath);
    }
  }
}

console.log('Syncing sidebar icons from frontmatter...\n');
processDir(DOCS_DIR);
console.log('\nDone!');

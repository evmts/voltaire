#!/usr/bin/env bun
/**
 * Migrate Starlight MDX files to Mintlify format
 *
 * Conversions:
 * - Remove component imports
 * - <TabItem label="X"> → <Tab title="X">
 * - <Aside type="tip"> → <Tip>
 * - <Aside type="caution"> → <Warning>
 * - <Aside type="note"> → <Note>
 * - <CardGrid> and <Card> → markdown sections
 * - Remove syncKey from <Tabs>
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

function convertStarlightToMintlify(content: string): string {
  let result = content;

  // Remove Starlight component imports
  result = result.replace(/import\s+{[^}]+}\s+from\s+['"]@astrojs\/starlight\/components['"]\s*;?\s*/g, '');

  // Convert Tabs
  result = result.replace(/<Tabs\s+syncKey="[^"]*">/g, '<Tabs>');

  // Convert TabItem to Tab
  result = result.replace(/<TabItem\s+label=/g, '<Tab title=');
  result = result.replace(/<\/TabItem>/g, '</Tab>');

  // Convert Aside to Mintlify callouts
  result = result.replace(/<Aside\s+type="tip"(?:\s+title="([^"]*)")?>/g, (match, title) => {
    return title ? `<Tip title="${title}">` : '<Tip>';
  });
  result = result.replace(/<Aside\s+type="caution"(?:\s+title="([^"]*)")?>/g, (match, title) => {
    return title ? `<Warning title="${title}">` : '<Warning>';
  });
  result = result.replace(/<Aside\s+type="note"(?:\s+title="([^"]*)")?>/g, (match, title) => {
    return title ? `<Note title="${title}">` : '<Note>';
  });
  result = result.replace(/<\/Aside>/g, (match) => {
    // Determine which closing tag based on context
    const lines = result.split('\n');
    // Simple heuristic: find the last opening tag before this closing
    let lastOpen = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('<Tip>') || lines[i].includes('<Tip title=')) {
        lastOpen = '</Tip>';
        break;
      }
      if (lines[i].includes('<Warning>') || lines[i].includes('<Warning title=')) {
        lastOpen = '</Warning>';
        break;
      }
      if (lines[i].includes('<Note>') || lines[i].includes('<Note title=')) {
        lastOpen = '</Note>';
        break;
      }
    }
    return lastOpen || '</Note>';
  });

  // Convert CardGrid to markdown sections (simple removal, content preserved)
  result = result.replace(/<CardGrid(?:\s+[^>]*)?>[\s\S]*?<\/CardGrid>/g, (match) => {
    // Extract Card content and convert to simple markdown sections
    const cards = match.match(/<Card\s+title="([^"]*)"[^>]*>([\s\S]*?)<\/Card>/g) || [];
    let markdown = '\n';

    for (const card of cards) {
      const titleMatch = card.match(/title="([^"]*)"/);
      const contentMatch = card.match(/<Card[^>]*>([\s\S]*?)<\/Card>/);

      if (titleMatch && contentMatch) {
        const title = titleMatch[1];
        const content = contentMatch[1].trim();
        markdown += `### ${title}\n\n${content}\n\n`;
      }
    }

    return markdown;
  });

  // Remove Badge components (not in Mintlify)
  result = result.replace(/<Badge\s+[^>]*>/g, '');

  // Remove Steps components (convert to numbered list if needed)
  result = result.replace(/<Steps>/g, '');
  result = result.replace(/<\/Steps>/g, '');

  // Clean up multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  // Clean up any remaining empty import lines
  result = result.replace(/^\s*import\s*;\s*$/gm, '');

  return result;
}

function migrateFile(sourcePath: string, destPath: string): void {
  const content = readFileSync(sourcePath, 'utf-8');
  const converted = convertStarlightToMintlify(content);

  // Ensure destination directory exists
  mkdirSync(dirname(destPath), { recursive: true });

  writeFileSync(destPath, converted, 'utf-8');
}

function migrateDirectory(sourceDir: string, destDir: string): number {
  let fileCount = 0;

  const entries = readdirSync(sourceDir);

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry);
    const destPath = join(destDir, entry);

    const stat = statSync(sourcePath);

    if (stat.isDirectory()) {
      fileCount += migrateDirectory(sourcePath, destPath);
    } else if (entry.endsWith('.mdx') || entry.endsWith('.md')) {
      migrateFile(sourcePath, destPath);
      fileCount++;
      console.log(`Converted: ${entry}`);
    }
  }

  return fileCount;
}

// Main execution
const primitives = [
  'hash',
  'hex',
  'base64',
  'binarytree',
  'bloomfilter',
  'chain',
  'denomination',
  'transaction'
];

const baseSourceDir = '/Users/williamcory/voltaire/src/content/docs/primitives';
const baseDestDir = '/Users/williamcory/voltaire/docs/primitives';

let totalFiles = 0;

for (const primitive of primitives) {
  const sourceDir = join(baseSourceDir, primitive);
  const destDir = join(baseDestDir, primitive);

  if (existsSync(sourceDir)) {
    console.log(`\nMigrating ${primitive}...`);
    const count = migrateDirectory(sourceDir, destDir);
    totalFiles += count;
    console.log(`${primitive}: ${count} files`);
  } else {
    console.log(`Warning: ${sourceDir} not found`);
  }
}

console.log(`\n✓ Total files converted: ${totalFiles}`);

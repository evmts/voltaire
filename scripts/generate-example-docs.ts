#!/usr/bin/env bun
/**
 * Generate MDX documentation files from executable example scripts.
 *
 * This script:
 * 1. Scans examples/ directory for .ts files
 * 2. Extracts code between SNIPPET:START and SNIPPET:END markers
 * 3. Generates MDX files in docs/examples/ with proper frontmatter
 * 4. Creates a manifest for mint.json navigation
 *
 * Usage: bun run scripts/generate-example-docs.ts
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, dirname, basename, parse } from 'node:path';
import { existsSync } from 'node:fs';

interface ExampleMetadata {
  category: string;
  name: string;
  sourcePath: string;
  outputPath: string;
  snippet: string;
  title: string;
  description: string;
}

const EXAMPLES_DIR = join(process.cwd(), 'examples');
const DOCS_OUTPUT_DIR = join(process.cwd(), 'docs/examples');
const SNIPPET_START = '// SNIPPET:START';
const SNIPPET_END = '// SNIPPET:END';

/**
 * Recursively find all .ts files in a directory
 */
async function findTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        files.push(...await findTsFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Directory might not exist yet
  }

  return files;
}

/**
 * Extract snippet from file content between markers
 */
function extractSnippet(content: string): string | null {
  const startIdx = content.indexOf(SNIPPET_START);
  const endIdx = content.indexOf(SNIPPET_END);

  if (startIdx === -1 || endIdx === -1) {
    return null;
  }

  const snippet = content.slice(startIdx + SNIPPET_START.length, endIdx).trim();
  return snippet;
}

/**
 * Transform relative imports to package imports for documentation
 * Converts: ../../src/crypto/Keccak256/index.js -> @tevm/voltaire/Keccak256
 * Converts: ../../src/primitives/Address/index.js -> @tevm/voltaire/Address
 */
function transformImportsForDocs(snippet: string): string {
  return snippet.replace(
    /from ['"]\.\.\/\.\.\/src\/(crypto|primitives|evm|jsonrpc)\/([^\/]+)\/index\.js['"]/g,
    "from '@tevm/voltaire/$2'"
  );
}

/**
 * Extract metadata from file content (comments at top)
 */
function extractMetadata(content: string): { title?: string; description?: string } {
  const lines = content.split('\n');
  let title: string | undefined;
  let description: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('// @title ')) {
      title = trimmed.replace('// @title ', '').trim();
    } else if (trimmed.startsWith('// @description ')) {
      description = trimmed.replace('// @description ', '').trim();
    } else if (!trimmed.startsWith('//') && trimmed !== '') {
      // Stop at first non-comment line
      break;
    }
  }

  return { title, description };
}

/**
 * Generate title from filename
 */
function generateTitle(filename: string): string {
  return filename
    .replace(/\.ts$/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Process a single example file
 */
async function processExample(filePath: string): Promise<ExampleMetadata | null> {
  const content = await readFile(filePath, 'utf-8');
  const snippet = extractSnippet(content);

  if (!snippet) {
    console.warn(`⚠️  No snippet markers found in ${filePath}`);
    return null;
  }

  const relativePath = relative(EXAMPLES_DIR, filePath);
  const parsed = parse(relativePath);
  const category = dirname(relativePath);
  const name = parsed.name;

  const metadata = extractMetadata(content);
  const title = metadata.title || generateTitle(name);
  const description = metadata.description || `Example demonstrating ${title.toLowerCase()}`;

  const outputPath = join(DOCS_OUTPUT_DIR, category, `${name}.mdx`);

  return {
    category,
    name,
    sourcePath: filePath,
    outputPath,
    snippet,
    title,
    description,
  };
}

/**
 * Generate MDX content from example metadata
 */
function generateMdx(example: ExampleMetadata): string {
  const relativeSourcePath = relative(process.cwd(), example.sourcePath).replace(/\\/g, '/');
  const transformedSnippet = transformImportsForDocs(example.snippet);

  return `---
title: "${example.title}"
description: "${example.description}"
---

${example.description}

\`\`\`typescript
${transformedSnippet}
\`\`\`

<Tip>
This is a fully executable example. View the complete source with test assertions at [\`${relativeSourcePath}\`](https://github.com/roninjin10/voltaire/blob/main/${relativeSourcePath}).
</Tip>

## Related

- [API Reference](/primitives)
- [More Examples](/examples)
`;
}

/**
 * Generate mint.json navigation structure
 */
function generateNavigation(examples: ExampleMetadata[]): any {
  const categories = new Map<string, any[]>();

  for (const example of examples) {
    if (!categories.has(example.category)) {
      categories.set(example.category, []);
    }

    const path = `examples/${example.category}/${example.name}`;
    categories.get(example.category)!.push({
      title: example.title,
      path,
    });
  }

  const navigation = {
    group: "Examples",
    pages: [] as any[],
  };

  // Sort categories in preferred order
  const categoryOrder = [
    'getting-started',
    'addresses',
    'hex-and-bytes',
    'hashing',
    'signing',
    'transactions',
    'rlp',
    'abi',
    'smart-contracts',
    'wallets',
    'advanced-crypto',
    'evm',
  ];

  for (const category of categoryOrder) {
    const pages = categories.get(category);
    if (pages && pages.length > 0) {
      const categoryTitle = category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      navigation.pages.push({
        group: categoryTitle,
        pages: pages.sort((a, b) => a.title.localeCompare(b.title)),
      });
    }
  }

  return navigation;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning for example files...');
  const files = await findTsFiles(EXAMPLES_DIR);
  console.log(`Found ${files.length} TypeScript files`);

  const examples: ExampleMetadata[] = [];

  for (const file of files) {
    const example = await processExample(file);
    if (example) {
      examples.push(example);
    }
  }

  console.log(`\n📝 Processing ${examples.length} examples...`);

  let generated = 0;
  let skipped = 0;

  for (const example of examples) {
    try {
      // Ensure output directory exists
      await mkdir(dirname(example.outputPath), { recursive: true });

      // Generate MDX content
      const mdx = generateMdx(example);

      // Write file
      await writeFile(example.outputPath, mdx, 'utf-8');

      console.log(`✅ Generated: ${relative(process.cwd(), example.outputPath)}`);
      generated++;
    } catch (err) {
      console.error(`❌ Failed to generate ${example.outputPath}:`, err);
      skipped++;
    }
  }

  // Generate navigation manifest
  const navigation = generateNavigation(examples);
  const manifestPath = join(process.cwd(), 'docs/examples-navigation.json');
  await writeFile(manifestPath, JSON.stringify(navigation, null, 2), 'utf-8');

  console.log(`\n📊 Summary:`);
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`\n📋 Navigation manifest: ${relative(process.cwd(), manifestPath)}`);
  console.log('\n💡 Next: Manually merge docs/examples-navigation.json into docs/mint.json');

  process.exit(skipped > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

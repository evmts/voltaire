#!/usr/bin/env bun
/**
 * Validate all example scripts by running them as tests.
 *
 * This script:
 * 1. Finds all .ts files in examples/ directory
 * 2. Executes each file with bun
 * 3. Checks exit codes (0 = success, non-zero = failure)
 * 4. Reports results
 *
 * Usage: bun run scripts/validate-examples.ts
 */

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const EXAMPLES_DIR = join(process.cwd(), 'examples');

interface TestResult {
  file: string;
  passed: boolean;
  exitCode: number;
  stdout?: string;
  stderr?: string;
  duration: number;
}

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
    // Directory might not exist
  }

  return files;
}

/**
 * Run a single example file and return result
 */
async function runExample(filePath: string): Promise<TestResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const proc = spawn('bun', ['run', filePath], {
      cwd: process.cwd(),
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (exitCode) => {
      const duration = Date.now() - startTime;
      resolve({
        file: filePath,
        passed: exitCode === 0,
        exitCode: exitCode || 0,
        stdout: stdout.trim() || undefined,
        stderr: stderr.trim() || undefined,
        duration,
      });
    });

    proc.on('error', (err) => {
      const duration = Date.now() - startTime;
      resolve({
        file: filePath,
        passed: false,
        exitCode: 1,
        stderr: err.message,
        duration,
      });
    });
  });
}

/**
 * Format duration in ms to human readable
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get relative path from cwd
 */
function getRelativePath(filePath: string): string {
  return filePath.replace(process.cwd() + '/', '');
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Finding example files...');
  const files = await findTsFiles(EXAMPLES_DIR);

  if (files.length === 0) {
    console.log('⚠️  No example files found');
    process.exit(0);
  }

  console.log(`Found ${files.length} example files\n`);
  console.log('🧪 Running examples...\n');

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const relativePath = getRelativePath(file);
    process.stdout.write(`   ${relativePath} ... `);

    const result = await runExample(file);
    results.push(result);

    if (result.passed) {
      console.log(`✅ (${formatDuration(result.duration)})`);
      passed++;
    } else {
      console.log(`❌ (exit code: ${result.exitCode})`);
      failed++;

      // Print stderr if available
      if (result.stderr) {
        console.log(`      ${result.stderr.split('\n').join('\n      ')}`);
      }
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total:  ${files.length}`);

  // Show failed tests
  if (failed > 0) {
    console.log('\n❌ Failed examples:');
    for (const result of results) {
      if (!result.passed) {
        console.log(`   - ${getRelativePath(result.file)}`);
        if (result.stderr) {
          console.log(`     ${result.stderr.split('\n')[0]}`);
        }
      }
    }
  }

  // Calculate total time
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`\n⏱️  Total time: ${formatDuration(totalTime)}`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

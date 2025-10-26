#!/usr/bin/env bun
/**
 * Script to run all benchmarks and generate BENCHMARKS.md files
 * This replaces the generic COMPARISON.md files with actual benchmark results
 */

import { $ } from "bun";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative, dirname, basename } from "node:path";

const COMPARISONS_DIR = join(import.meta.dir, "../comparisons");
const DRY_RUN = process.argv.includes("--dry-run");

interface BenchmarkResult {
  name: string;
  hz: string;
  min: string;
  max: string;
  mean: string;
  p75: string;
  p99: string;
  p995: string;
  p999: string;
  rme: string;
  samples: string;
  notes?: string;
}

interface BenchmarkOutput {
  testName: string;
  results: BenchmarkResult[];
  summary: string[];
  success: boolean;
  error?: string;
}

/**
 * Find all .bench.ts files recursively
 */
async function findBenchmarkFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith(".bench.ts")) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files.sort();
}

/**
 * Run a single benchmark file and capture output
 */
async function runBenchmark(benchFile: string): Promise<BenchmarkOutput> {
  console.log(`\n📊 Running: ${relative(COMPARISONS_DIR, benchFile)}`);

  try {
    // Run vitest benchmark
    const result = await $`bun run vitest bench ${benchFile} --run --reporter=verbose`.text();

    // Parse the output
    const output = parseBenchmarkOutput(result, benchFile);

    if (output.success) {
      console.log(`   ✅ Success - ${output.results.length} implementations tested`);
    } else {
      console.log(`   ⚠️  Failed - ${output.error}`);
    }

    return output;
  } catch (error) {
    console.log(`   ❌ Error running benchmark`);
    return {
      testName: basename(benchFile, ".bench.ts"),
      results: [],
      summary: [],
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Parse vitest benchmark output
 */
function parseBenchmarkOutput(output: string, benchFile: string): BenchmarkOutput {
  const lines = output.split("\n");
  const results: BenchmarkResult[] = [];
  const summary: string[] = [];
  let testName = basename(benchFile, ".bench.ts");
  let inBenchResults = false;
  let inSummary = false;

  for (const line of lines) {
    // Extract test name from describe block
    if (line.includes(">") && !line.includes("BENCH") && !line.includes("Summary")) {
      const match = line.match(/>\s+(.+?)\s+\d+ms/);
      if (match) {
        testName = match[1];
      }
    }

    // Parse benchmark results table
    if (line.includes("name") && line.includes("hz")) {
      inBenchResults = true;
      continue;
    }

    if (inBenchResults && line.trim().startsWith("·")) {
      const parts = line
        .replace(/·/g, "")
        .trim()
        .split(/\s+/);

      if (parts.length >= 10) {
        const result: BenchmarkResult = {
          name: parts[0],
          hz: parts[1],
          min: parts[2],
          max: parts[3],
          mean: parts[4],
          p75: parts[5],
          p99: parts[6],
          p995: parts[7],
          p999: parts[8],
          rme: parts[9],
          samples: parts[10],
          notes: parts.slice(11).join(" "),
        };
        results.push(result);
      }
    }

    // Parse summary section
    if (line.includes("BENCH") && line.includes("Summary")) {
      inBenchResults = false;
      inSummary = true;
      continue;
    }

    if (inSummary && line.trim() && !line.includes("⎯")) {
      summary.push(line.trim());
    }
  }

  return {
    testName,
    results,
    summary,
    success: results.length > 0,
  };
}

/**
 * Generate BENCHMARKS.md content from benchmark results
 */
function generateBenchmarksMarkdown(output: BenchmarkOutput, benchFile: string): string {
  const fileName = basename(benchFile, ".bench.ts");
  const category = basename(dirname(benchFile));

  let md = `# ${fileName} - Benchmark Results\n\n`;
  md += `Performance benchmarks comparing implementations across different libraries.\n\n`;

  if (!output.success) {
    md += `## ⚠️ Benchmark Failed\n\n`;
    md += `This benchmark could not be run successfully.\n\n`;
    if (output.error) {
      md += `**Error:**\n\`\`\`\n${output.error}\n\`\`\`\n\n`;
    }
    md += `This may be due to missing build artifacts or dependencies.\n\n`;
    return md;
  }

  md += `## Results\n\n`;
  md += `Test: **${output.testName}**\n\n`;

  // Results table
  md += `| Implementation | ops/sec | min | max | mean | p75 | p99 | p995 | p999 | rme | samples | notes |\n`;
  md += `|---|---|---|---|---|---|---|---|---|---|---|---|\n`;

  for (const result of output.results) {
    md += `| ${result.name} | ${result.hz} | ${result.min} | ${result.max} | ${result.mean} | ${result.p75} | ${result.p99} | ${result.p995} | ${result.p999} | ${result.rme} | ${result.samples} | ${result.notes || ""} |\n`;
  }

  md += `\n`;

  // Summary section
  if (output.summary.length > 0) {
    md += `## Summary\n\n`;
    for (const line of output.summary) {
      md += `${line}\n`;
    }
    md += `\n`;
  }

  // Add metadata
  md += `## Benchmark Info\n\n`;
  md += `- **File**: \`${relative(COMPARISONS_DIR, benchFile)}\`\n`;
  md += `- **Category**: ${category}\n`;
  md += `- **Date**: ${new Date().toISOString().split("T")[0]}\n`;
  md += `- **Tool**: Vitest Benchmark\n\n`;

  md += `---\n\n`;
  md += `*Generated by running \`bun run scripts/run-benchmarks.ts\`*\n`;

  return md;
}

/**
 * Write BENCHMARKS.md file
 */
async function writeBenchmarksFile(benchFile: string, output: BenchmarkOutput) {
  const benchDir = dirname(benchFile);
  const benchmarksFile = join(benchDir, "BENCHMARKS.md");

  const markdown = generateBenchmarksMarkdown(output, benchFile);

  if (DRY_RUN) {
    console.log(`   📝 Would write: ${relative(COMPARISONS_DIR, benchmarksFile)}`);
    return;
  }

  await Bun.write(benchmarksFile, markdown);
  console.log(`   📝 Wrote: ${relative(COMPARISONS_DIR, benchmarksFile)}`);
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting benchmark runner\n");
  console.log(`📂 Comparisons directory: ${COMPARISONS_DIR}`);

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No files will be written\n");
  }

  // Find all benchmark files
  const benchFiles = await findBenchmarkFiles(COMPARISONS_DIR);
  console.log(`\n📋 Found ${benchFiles.length} benchmark files\n`);

  const stats = {
    total: benchFiles.length,
    success: 0,
    failed: 0,
  };

  // Run each benchmark
  for (const benchFile of benchFiles) {
    const output = await runBenchmark(benchFile);

    if (output.success) {
      stats.success++;
      await writeBenchmarksFile(benchFile, output);
    } else {
      stats.failed++;
      // Still write the file to document the failure
      await writeBenchmarksFile(benchFile, output);
    }
  }

  // Final summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 FINAL SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`Total benchmarks: ${stats.total}`);
  console.log(`✅ Successful: ${stats.success}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`${"=".repeat(60)}\n`);

  if (stats.failed > 0) {
    console.log("⚠️  Some benchmarks failed. Check the BENCHMARKS.md files for details.\n");
  }

  console.log("✨ Done!\n");
}

// Run the script
main().catch(console.error);

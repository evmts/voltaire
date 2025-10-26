import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import type { BenchmarkResult } from "./types.js";

/**
 * Run vitest benchmarks and return parsed results
 */
export async function runBenchmark(
	benchmarkPath: string,
): Promise<Record<string, BenchmarkResult>> {
	try {
		// Run vitest bench with JSON reporter
		execSync(
			`bun run vitest bench ${benchmarkPath} --run --reporter=json --outputFile=./benchmark-results.json`,
			{
				stdio: "pipe",
				cwd: process.cwd(),
			},
		);

		// Read and parse results
		const resultsJson = readFileSync("./benchmark-results.json", "utf-8");
		const results = JSON.parse(resultsJson);

		// Parse vitest benchmark results into our format
		return parseBenchmarkResults(results);
	} catch (error) {
		console.error("Failed to run benchmark:", error);
		throw error;
	}
}

/**
 * Parse vitest JSON output into our BenchmarkResult format
 */
function parseBenchmarkResults(
	vitestResults: any,
): Record<string, BenchmarkResult> {
	const benchmarks: Record<string, BenchmarkResult> = {};

	// Vitest benchmark JSON structure varies by version
	// This is a generic parser that should work with most versions
	if (vitestResults.testResults) {
		for (const testResult of vitestResults.testResults) {
			if (testResult.assertionResults) {
				for (const assertion of testResult.assertionResults) {
					if (assertion.benchmark) {
						const bench = assertion.benchmark;
						benchmarks[assertion.title] = {
							name: assertion.title,
							opsPerSecond: bench.hz || 0,
							mean: bench.mean || 0,
							variance: bench.variance || 0,
							standardDeviation: bench.sd || 0,
							marginOfError: bench.moe || 0,
							relativeMarginOfError: bench.rme || 0,
							samples: bench.samples?.length || 0,
						};
					}
				}
			}
		}
	}

	return benchmarks;
}

/**
 * Format benchmark results for display
 */
export function formatBenchmarkResults(
	results: Record<string, BenchmarkResult>,
): string {
	let output = "## Benchmark Results\n\n";
	output += "| Library | Ops/sec | Mean (ms) | Std Dev | Samples |\n";
	output += "|---------|---------|-----------|---------|----------|\n";

	for (const [name, result] of Object.entries(results)) {
		output += `| ${name} | ${result.opsPerSecond.toFixed(0)} | ${(result.mean * 1000).toFixed(4)} | ${(result.standardDeviation * 1000).toFixed(4)} | ${result.samples} |\n`;
	}

	return output;
}

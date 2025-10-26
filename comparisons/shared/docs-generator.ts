import { readFileSync } from "node:fs";
import type { DocsGenerationOptions, ImplementationFiles } from "./types.js";
import { formatBenchmarkResults, runBenchmark } from "./vitest-runner.js";

/**
 * Generate markdown documentation comparing implementations
 */
export async function generateDocs(
	options: DocsGenerationOptions,
): Promise<string> {
	const { category, description, implementationFiles, benchmarkResultsPath } =
		options;

	let markdown = `# ${category} Benchmark\n\n`;
	markdown += `${description}\n\n`;

	// Add code examples section
	markdown += "## Implementations\n\n";
	markdown += await generateCodeExamples(implementationFiles);

	// Run benchmarks and add results
	markdown += "\n## Performance Comparison\n\n";
	try {
		const results = await runBenchmark(benchmarkResultsPath);
		markdown += formatBenchmarkResults(results);
	} catch (error) {
		markdown += `*Benchmark results unavailable: ${error}*\n`;
	}

	// Placeholder for bundle size (to be added later)
	if (options.includeBundle) {
		markdown += "\n## Bundle Size\n\n";
		markdown += "*Bundle size comparison coming soon*\n";
	}

	return markdown;
}

/**
 * Generate code examples section from implementation files
 */
async function generateCodeExamples(
	files: ImplementationFiles,
): Promise<string> {
	let markdown = "";

	// Guil implementation
	markdown += "### Guil (@tevm/primitives)\n\n";
	markdown += "```typescript\n";
	markdown += readFileSync(files.guil, "utf-8");
	markdown += "\n```\n\n";

	// Ethers implementation
	markdown += "### Ethers\n\n";
	markdown += "```typescript\n";
	markdown += readFileSync(files.ethers, "utf-8");
	markdown += "\n```\n\n";

	// Viem implementation
	markdown += "### Viem\n\n";
	markdown += "```typescript\n";
	markdown += readFileSync(files.viem, "utf-8");
	markdown += "\n```\n\n";

	return markdown;
}

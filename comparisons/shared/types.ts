/**
 * Shared types for benchmark comparisons
 */

/**
 * Benchmark result for a single library
 */
export interface BenchmarkResult {
	name: string;
	opsPerSecond: number;
	mean: number;
	variance: number;
	standardDeviation: number;
	marginOfError: number;
	relativeMarginOfError: number;
	samples: number;
}

/**
 * Benchmark results for all libraries in a category
 */
export interface CategoryBenchmarkResults {
	category: string;
	results: {
		guil: BenchmarkResult;
		ethers: BenchmarkResult;
		viem: BenchmarkResult;
	};
}

/**
 * Implementation file paths
 */
export interface ImplementationFiles {
	guil: string;
	ethers: string;
	viem: string;
}

/**
 * Documentation generation options
 */
export interface DocsGenerationOptions {
	category: string;
	description: string;
	implementationFiles: ImplementationFiles;
	benchmarkResultsPath: string;
	includeBundle?: boolean;
}

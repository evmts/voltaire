#!/usr/bin/env bun

/**
 * Test runner for all TypeScript examples
 *
 * Discovers and runs all .ts examples in the examples/ directory,
 * reporting successes and failures.
 */

import { spawn } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

interface TestResult {
	file: string;
	success: boolean;
	error?: string;
	duration: number;
}

/**
 * Recursively find all .ts files in a directory
 */
function findTypeScriptFiles(dir: string, files: string[] = []): string[] {
	const entries = readdirSync(dir);

	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			findTypeScriptFiles(fullPath, files);
		} else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * Run a single TypeScript example file
 */
async function runExample(file: string): Promise<TestResult> {
	const start = Date.now();

	return new Promise((resolve) => {
		const proc = spawn("bun", ["run", file], {
			stdio: "pipe",
			timeout: 30000, // 30 second timeout
		});

		let stdout = "";
		let stderr = "";

		proc.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		proc.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		proc.on("close", (code) => {
			const duration = Date.now() - start;

			if (code === 0) {
				resolve({ file, success: true, duration });
			} else {
				resolve({
					file,
					success: false,
					error: stderr || stdout || `Exit code: ${code}`,
					duration,
				});
			}
		});

		proc.on("error", (err) => {
			const duration = Date.now() - start;
			resolve({
				file,
				success: false,
				error: err.message,
				duration,
			});
		});
	});
}

/**
 * Main test runner
 */
async function main() {

	const examplesDir = join(process.cwd(), "examples");
	const files = findTypeScriptFiles(examplesDir).sort();

	const results: TestResult[] = [];
	let passed = 0;
	let failed = 0;

	// Run examples sequentially to avoid overwhelming the system
	for (const file of files) {
		const relPath = relative(examplesDir, file);
		process.stdout.write(`  ${relPath} ... `);

		const result = await runExample(file);
		results.push(result);

		if (result.success) {
			passed++;
		} else {
			failed++;
		}
	}

	// Show failures
	if (failed > 0) {

		const failures = results.filter((r) => !r.success);
		for (const failure of failures) {
			const relPath = relative(examplesDir, failure.file);
			if (failure.error) {
				const errorLines = failure.error.split("\n").slice(0, 5);
				errorLines.forEach((line) => );
				if (failure.error.split("\n").length > 5) {
				}
			}
		}
	}

	// Exit with appropriate code
	process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});

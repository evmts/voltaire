#!/usr/bin/env bun

import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

interface WasmFile {
	path: string;
	size: number;
}

function findWasmFiles(dir: string, files: WasmFile[] = []): WasmFile[] {
	try {
		const entries = readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(dir, entry.name);

			if (entry.isDirectory()) {
				findWasmFiles(fullPath, files);
			} else if (entry.isFile() && entry.name.endsWith(".wasm")) {
				const stats = statSync(fullPath);
				files.push({
					path: fullPath,
					size: stats.size,
				});
			}
		}
	} catch (error) {
		// Directory doesn't exist or not accessible
	}

	return files;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

function main() {
	const zigOutBinDir = "zig-out/bin";
	const wasmFiles = findWasmFiles(zigOutBinDir);

	if (wasmFiles.length === 0) {
		process.exit(1);
	}

	// Sort by path for consistent output
	wasmFiles.sort((a, b) => a.path.localeCompare(b.path));

	let output = "WASM Bundle Sizes:\n";
	let totalSize = 0;

	for (const file of wasmFiles) {
		const relativePath = relative(zigOutBinDir, file.path);
		const formatted = formatBytes(file.size);
		output += `  ${relativePath}: ${formatted} (${file.size.toLocaleString()} bytes)\n`;
		totalSize += file.size;
	}

	output += `\nTotal: ${formatBytes(totalSize)} (${totalSize.toLocaleString()} bytes)\n`;

	// Write to benchmarks/wasm-size.txt
	try {
		mkdirSync("benchmarks", { recursive: true });
	} catch (error) {
		// Directory might already exist
	}

	const timestamp = new Date().toISOString();
	const fileOutput = `Generated: ${timestamp}\n\n${output}`;
	writeFileSync("benchmarks/wasm-size.txt", fileOutput);
}

main();

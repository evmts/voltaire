#!/usr/bin/env bun
// Run all playground examples to verify they work

import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { spawn } from "node:child_process";

const examplesDir = import.meta.dir;
const rootDir = join(examplesDir, "../..");

async function* walkDir(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walkDir(path);
		} else if (entry.name.endsWith(".js") && entry.name !== "run-all.js") {
			yield path;
		}
	}
}

async function runExample(path) {
	return new Promise((resolve) => {
		const relativePath = relative(rootDir, path);
		const proc = spawn("bun", [path], {
			cwd: rootDir,
			stdio: ["ignore", "pipe", "pipe"],
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
			resolve({
				path: relativePath,
				code,
				stdout,
				stderr,
				success: code === 0,
			});
		});

		// Timeout after 10 seconds
		setTimeout(() => {
			proc.kill();
			resolve({
				path: relativePath,
				code: -1,
				stdout,
				stderr: "TIMEOUT",
				success: false,
			});
		}, 10000);
	});
}

async function main() {
	console.log("Running all playground examples...\n");

	const results = [];
	let passed = 0;
	let failed = 0;

	for await (const path of walkDir(examplesDir)) {
		const result = await runExample(path);
		results.push(result);

		if (result.success) {
			console.log(`✓ ${result.path}`);
			passed++;
		} else {
			console.log(`✗ ${result.path}`);
			if (result.stderr) {
				console.log(`  Error: ${result.stderr.split("\n")[0]}`);
			}
			failed++;
		}
	}

	console.log(`\n${passed} passed, ${failed} failed`);

	if (failed > 0) {
		process.exit(1);
	}
}

main().catch(console.error);

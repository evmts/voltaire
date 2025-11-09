#!/usr/bin/env bun

/**
 * Measure and compare bundle sizes for primitives
 * Compares ReleaseSmall vs ReleaseFast WASM, and WASM vs pure TypeScript
 */

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

interface SizeResult {
	name: string;
	path: string;
	bytes: number;
	kb: string;
	mb?: string;
}

function formatBytes(bytes: number): { kb: string; mb?: string } {
	const kb = (bytes / 1024).toFixed(2);
	const mb =
		bytes > 1024 * 1024 ? (bytes / (1024 * 1024)).toFixed(2) : undefined;
	return { kb, mb };
}

function measureFile(path: string, name: string): SizeResult {
	const stats = statSync(path);
	const { kb, mb } = formatBytes(stats.size);
	return {
		name,
		path,
		bytes: stats.size,
		kb,
		mb,
	};
}

function measureDirectory(dirPath: string, pattern: RegExp): SizeResult[] {
	try {
		const files = readdirSync(dirPath);
		return files
			.filter((file) => pattern.test(file))
			.map((file) => {
				const fullPath = join(dirPath, file);
				return measureFile(fullPath, file);
			});
	} catch {
		return [];
	}
}

const wasmResults: SizeResult[] = [];

try {
	const releaseSmall = measureFile(
		"wasm/primitives.wasm",
		"ReleaseSmall (optimized for size)",
	);
	wasmResults.push(releaseSmall);
} catch {}

try {
	const releaseFast = measureFile(
		"wasm/primitives-fast.wasm",
		"ReleaseFast (optimized for speed)",
	);
	wasmResults.push(releaseFast);
} catch {}

try {
	const keccak = measureFile("wasm/keccak256.wasm", "Keccak256 WASM");
	wasmResults.push(keccak);
} catch {}

// Standalone crypto modules
const cryptoWasmResults: SizeResult[] = [];
try {
	const standaloneKeccak = measureFile(
		"wasm/crypto/keccak256.wasm",
		"Standalone Keccak256 (Zig stdlib only)",
	);
	cryptoWasmResults.push(standaloneKeccak);
} catch {}

if (wasmResults.length >= 2) {
	const sizeRatio = (wasmResults[1].bytes / wasmResults[0].bytes).toFixed(2);
}

const primitiveNames = [
	"Address",
	"Hex",
	"Uint",
	"Hash",
	"Transaction",
	"Rlp",
	"Abi",
	"AccessList",
	"Blob",
	"EventLog",
	"Bytecode",
];

const tsResults: SizeResult[] = [];

for (const primitive of primitiveNames) {
	try {
		const files = measureDirectory(`dist/primitives/${primitive}`, /\.js$/);
		if (files.length > 0) {
			const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0);
			const { kb } = formatBytes(totalBytes);
			tsResults.push({
				name: primitive,
				path: `dist/primitives/${primitive}`,
				bytes: totalBytes,
				kb,
			});
		}
	} catch {
		// Primitive not built yet
	}
}

try {
	const cryptoFiles = measureDirectory("dist/crypto", /\.js$/);
	if (cryptoFiles.length > 0) {
		const totalBytes = cryptoFiles.reduce((sum, f) => sum + f.bytes, 0);
		const { kb } = formatBytes(totalBytes);
	}
} catch {}

const cryptoResults: Array<SizeResult & { type: string }> = [];

// Measure Noble implementation
try {
	const nobleFiles = measureDirectory("dist/crypto", /keccak256\.js$/);
	if (nobleFiles.length > 0) {
		const nobleSize = nobleFiles[0];
		cryptoResults.push({
			...nobleSize,
			type: "Noble (@noble/hashes) - Pure TS",
			name: "keccak256.js",
		});
	}
} catch {}

// Measure standalone WASM wrapper
try {
	const standaloneWrapper = measureFile(
		"dist/crypto/keccak256.standalone.js",
		"Standalone WASM Wrapper",
	);
	cryptoResults.push({
		...standaloneWrapper,
		type: "WASM Wrapper - TS",
		name: "keccak256.standalone.js",
	});
} catch {}

// Show standalone WASM size
if (cryptoWasmResults.length > 0) {
	const wasmSize = cryptoWasmResults[0];
	cryptoResults.push({
		...wasmSize,
		type: "Zig stdlib - WASM binary",
		name: "keccak256.wasm",
	});
}

// Calculate total bundle sizes
if (cryptoResults.length >= 2) {
	const nobleOnly = cryptoResults.find((r) => r.type.includes("Noble"));
	const wasmWrapper = cryptoResults.find((r) => r.type.includes("Wrapper"));
	const wasmBinary = cryptoResults.find((r) => r.type.includes("binary"));

	if (nobleOnly) {
	}

	if (wasmWrapper && wasmBinary) {
		const totalWasm = wasmWrapper.bytes + wasmBinary.bytes;
		const { kb } = formatBytes(totalWasm);

		if (nobleOnly) {
			const ratio = (totalWasm / nobleOnly.bytes).toFixed(2);
			const diff = ((totalWasm - nobleOnly.bytes) / 1024).toFixed(2);
		}
	}
}

if (wasmResults.length >= 2) {
}

if (tsResults.length > 0) {
	const totalTS = tsResults.reduce((sum, r) => sum + r.bytes, 0);
	const { kb: tsKb, mb: tsMb } = formatBytes(totalTS);

	if (wasmResults.length > 0) {
		const tsWasmRatio = (totalTS / wasmResults[0].bytes).toFixed(2);
	}
}

// Generate BUNDLE-SIZES.md
const md = `# Bundle Size Comparison

> Generated: ${new Date().toISOString()}

## WASM Build Modes

| Mode | Size | Optimization | Use Case |
|------|------|--------------|----------|
${wasmResults.map((r) => `| ${r.name} | ${r.mb ? `${r.mb} MB` : `${r.kb} KB`} | ${r.name.includes("Small") ? "Size" : r.name.includes("Fast") ? "Speed" : "N/A"} | ${r.name.includes("Small") ? "Production" : r.name.includes("Fast") ? "Benchmarking" : "Hashing"} |`).join("\n")}

${wasmResults.length >= 2 ? `**Size Impact:** ReleaseFast is ${(wasmResults[1].bytes / wasmResults[0].bytes).toFixed(2)}x larger than ReleaseSmall (+${((wasmResults[1].bytes - wasmResults[0].bytes) / 1024).toFixed(2)} KB)` : ""}

## TypeScript Primitives (Tree-Shaken)

| Primitive | Size | Files |
|-----------|------|-------|
${tsResults.map((r) => `| ${r.name} | ${r.kb} KB | Multiple |`).join("\n")}

${tsResults.length > 0 ? `**Total:** ${formatBytes(tsResults.reduce((sum, r) => sum + r.bytes, 0)).kb} KB across ${tsResults.length} primitives` : ""}

## Crypto Implementation Comparison

Comparing Keccak256 implementations:

| Implementation | Size | Type |
|----------------|------|------|
${cryptoResults.map((r) => `| ${r.type} | ${r.kb} KB | ${r.name} |`).join("\n")}

${(() => {
	const nobleOnly = cryptoResults.find((r) => r.type.includes("Noble"));
	const wasmWrapper = cryptoResults.find((r) => r.type.includes("Wrapper"));
	const wasmBinary = cryptoResults.find((r) => r.type.includes("binary"));

	if (nobleOnly && wasmWrapper && wasmBinary) {
		const totalWasm = wasmWrapper.bytes + wasmBinary.bytes;
		const { kb } = formatBytes(totalWasm);
		const ratio = (totalWasm / nobleOnly.bytes).toFixed(2);
		const diff = ((totalWasm - nobleOnly.bytes) / 1024).toFixed(2);
		return `**Bundle Comparison:**
- Noble (pure TS): ${nobleOnly.kb} KB
- WASM (wrapper + binary): ${kb} KB
- WASM is ${ratio}x ${totalWasm > nobleOnly.bytes ? "larger" : "smaller"} (${diff > "0" ? "+" : ""}${diff} KB)`;
	}
	return "";
})()}

## Recommendations

Based on bundle size analysis:

1. **Production:** Use ReleaseSmall WASM (${wasmResults[0]?.kb || "N/A"} KB)
   - Smallest bundle size
   - Good performance
   - Best for end users

2. **Benchmarking:** Use ReleaseFast WASM (${wasmResults[1]?.kb || "N/A"} KB)
   - Maximum performance
   - Larger bundle size acceptable for testing
   - Use to compare against pure JS/TS

3. **Tree-Shaking:** Import individual primitives instead of full bundle
   - Most primitives are < 15 KB when tree-shaken
   - Allows gradual adoption

## Commands

\`\`\`bash
# Build both WASM modes
bun run build:wasm

# Measure bundle sizes
bun run size

# Check size limits (CI)
bun run bench:size
\`\`\`
`;

try {
	await Bun.write("BUNDLE-SIZES.md", md);
} catch (error) {
	console.error("\n✗ Failed to write BUNDLE-SIZES.md:", error);
}

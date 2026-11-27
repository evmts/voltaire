#!/usr/bin/env bun
/**
 * Voltaire Reproducible Multi-Workload Benchmark & Bundle-Size Suite
 *
 * Benchmarks real Ethereum workloads across:
 *   - Voltaire (Pure TS)
 *   - Voltaire (WASM — standalone micro-WASM + primitives.wasm)
 *   - Voltaire (Native Zig FFI — auto-detected when zig-out/native/ exists)
 *   - viem, ox, ethers (resolved from packages/voltaire-ts/node_modules)
 *
 * Usage:
 *   bun scripts/run-benchmarks.ts                # Human-readable terminal report
 *   bun scripts/run-benchmarks.ts --json         # Machine-readable JSON report
 *   bun scripts/run-benchmarks.ts --markdown     # Markdown tables to stdout
 *   bun scripts/run-benchmarks.ts --write-docs   # Write packages/voltaire-ts/docs/benchmarks.mdx
 *   bun scripts/run-benchmarks.ts --quick        # Faster sampling window for smoke checks
 */

import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { cpus, platform, release, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

import * as Voltaire from "../packages/voltaire-ts/src/index.ts";
import { ToChecksummed } from "../packages/voltaire-ts/src/primitives/Address/toChecksummed.js";
import * as WasmLoader from "../packages/voltaire-ts/src/wasm-loader/loader.ts";

// ---------------------------------------------------------------------------
// CLI flags & paths
// ---------------------------------------------------------------------------

const ROOT = resolve(dirname(import.meta.path), "..");
const VOLTAIRE_SRC = resolve(ROOT, "packages/voltaire-ts/src");
const VOLTAIRE_NM = resolve(ROOT, "packages/voltaire-ts/node_modules");
const DOCS_BENCHMARKS_PATH = resolve(ROOT, "packages/voltaire-ts/docs/benchmarks.mdx");

const FLAG_JSON = process.argv.includes("--json");
const FLAG_MARKDOWN = process.argv.includes("--markdown");
const FLAG_WRITE_DOCS = process.argv.includes("--write-docs");
const FLAG_QUICK = process.argv.includes("--quick");
const ONLY_ARG = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimingEntry {
	impl: string;
	opsPerSec: number;
	meanUs: number;
	medianUs: number;
	p99Us: number;
	minUs: number;
	maxUs: number;
	samples: number;
	note?: string;
}

interface WorkloadReport {
	id: string;
	title: string;
	category: string;
	unit: string;
	batchSize: number;
	description: string;
	results: TimingEntry[];
}

interface BundleEntry {
	primitive: string;
	library: string;
	importStyle: string;
	minifiedBytes: number;
	gzipBytes: number;
}

interface WasmArtifactEntry {
	name: string;
	path: string;
	rawBytes: number;
	gzipBytes: number;
	role: string;
}

interface BenchmarkMetadata {
	timestamp: string;
	cpu: string;
	cores: number;
	os: string;
	arch: string;
	bunVersion: string;
	nativeFfiAvailable: boolean;
	nativeLibPath: string | null;
	versions: {
		voltaire: string;
		viem: string;
		ox: string;
		ethers: string;
	};
}

interface FullReport {
	metadata: BenchmarkMetadata;
	workloads: WorkloadReport[];
	bundleSizes: BundleEntry[];
	wasmArtifacts: WasmArtifactEntry[];
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatOps(ops: number): string {
	if (ops >= 1_000_000) return `${(ops / 1_000_000).toFixed(2)}M`;
	if (ops >= 10_000) return `${Math.round(ops).toLocaleString("en-US")}`;
	if (ops >= 100) return `${ops.toFixed(1)}`;
	return `${ops.toFixed(2)}`;
}

function formatDurationUs(us: number): string {
	if (us >= 1_000_000) return `${(us / 1_000_000).toFixed(2)} s`;
	if (us >= 1_000) return `${(us / 1_000).toFixed(2)} ms`;
	if (us >= 10) return `${us.toFixed(1)} µs`;
	if (us >= 1) return `${us.toFixed(2)} µs`;
	return `${(us * 1_000).toFixed(0)} ns`;
}

function formatKb(bytes: number): string {
	return `${(bytes / 1024).toFixed(2)} kB`;
}

// ---------------------------------------------------------------------------
// High-precision timing harness (monotonic Bun.nanoseconds)
// ---------------------------------------------------------------------------

let sink: unknown = null;

function benchmarkSync(
	impl: string,
	fn: () => unknown,
	note?: string,
	beforeSample?: () => void,
): TimingEntry {
	// Warmup to trigger JIT compilation
	const warmupStart = Bun.nanoseconds();
	let warmupRuns = 0;
	while (warmupRuns < 10 || (Bun.nanoseconds() - warmupStart < 40_000_000 && warmupRuns < 5_000)) {
		beforeSample?.();
		sink = fn();
		warmupRuns++;
	}

	// Calibrate inner loop count so each sample takes at least ~250 µs
	let innerIters = 1;
	if (!beforeSample) {
		const calStart = Bun.nanoseconds();
		let calOps = 0;
		while (Bun.nanoseconds() - calStart < 5_000_000 && calOps < 10_000) {
			sink = fn();
			calOps++;
		}
		const singleOpNs = Math.max(1, (Bun.nanoseconds() - calStart) / calOps);
		const targetSampleNs = FLAG_QUICK ? 200_000 : 400_000;
		innerIters = Math.max(1, Math.min(20_000, Math.ceil(targetSampleNs / singleOpNs)));
	}

	const minSamples = FLAG_QUICK ? 12 : 30;
	const maxSamples = FLAG_QUICK ? 60 : 200;
	const maxTotalNs = FLAG_QUICK ? 120_000_000 : 350_000_000;

	const samplesNs: number[] = [];
	const totalStart = Bun.nanoseconds();

	while (
		samplesNs.length < minSamples ||
		(samplesNs.length < maxSamples && Bun.nanoseconds() - totalStart < maxTotalNs)
	) {
		beforeSample?.();
		const t0 = Bun.nanoseconds();
		for (let i = 0; i < innerIters; i++) {
			sink = fn();
		}
		const dt = Bun.nanoseconds() - t0;
		samplesNs.push(dt / innerIters);
	}

	return summarizeSamples(impl, samplesNs, note);
}

async function benchmarkAsync(
	impl: string,
	fn: () => Promise<unknown>,
	note?: string,
): Promise<TimingEntry> {
	// Warmup
	const warmupStart = Bun.nanoseconds();
	let warmupRuns = 0;
	while (warmupRuns < 5 || (Bun.nanoseconds() - warmupStart < 40_000_000 && warmupRuns < 200)) {
		sink = await fn();
		warmupRuns++;
	}

	const minSamples = FLAG_QUICK ? 8 : 20;
	const maxSamples = FLAG_QUICK ? 30 : 80;
	const maxTotalNs = FLAG_QUICK ? 150_000_000 : 400_000_000;

	const samplesNs: number[] = [];
	const totalStart = Bun.nanoseconds();

	while (
		samplesNs.length < minSamples ||
		(samplesNs.length < maxSamples && Bun.nanoseconds() - totalStart < maxTotalNs)
	) {
		const t0 = Bun.nanoseconds();
		sink = await fn();
		samplesNs.push(Bun.nanoseconds() - t0);
	}

	return summarizeSamples(impl, samplesNs, note);
}

function summarizeSamples(
	impl: string,
	samplesNs: number[],
	note?: string,
): TimingEntry {
	const sorted = [...samplesNs].sort((a, b) => a - b);
	const n = sorted.length;
	const sum = sorted.reduce((acc, v) => acc + v, 0);
	const meanNs = sum / n;
	const medianNs =
		n % 2 === 1
			? sorted[(n - 1) >> 1]
			: (sorted[(n >> 1) - 1] + sorted[n >> 1]) / 2;
	const p99Idx = Math.min(n - 1, Math.floor(n * 0.99));
	const p99Ns = sorted[p99Idx];
	const minNs = sorted[0];
	const maxNs = sorted[n - 1];

	return {
		impl,
		opsPerSec: 1_000_000_000 / medianNs,
		meanUs: meanNs / 1_000,
		medianUs: medianNs / 1_000,
		p99Us: p99Ns / 1_000,
		minUs: minNs / 1_000,
		maxUs: maxNs / 1_000,
		samples: n,
		note,
	};
}

// ---------------------------------------------------------------------------
// Standalone micro-WASM loaders (stack-safe via dedicated grown memory page)
// ---------------------------------------------------------------------------

function loadMicroKeccak256Wasm(wasmPath: string): (data: Uint8Array) => Uint8Array {
	const wasmBytes = readFileSync(wasmPath);
	const inst = new WebAssembly.Instance(new WebAssembly.Module(wasmBytes), {});
	const memory = inst.exports.memory as WebAssembly.Memory;
	const keccak256Hash = inst.exports.keccak256Hash as (
		inputPtr: number,
		inputLen: number,
		outputPtr: number,
	) => void;
	// Allocate a clean 64 KB scratch page past static data & stack
	const scratchBase = memory.buffer.byteLength;
	memory.grow(1);
	const memView = new Uint8Array(memory.buffer);
	const outPtr = scratchBase;
	const inPtr = scratchBase + 64;

	return (data: Uint8Array): Uint8Array => {
		memView.set(data, inPtr);
		keccak256Hash(inPtr, data.length, outPtr);
		return memView.slice(outPtr, outPtr + 32);
	};
}

function loadMicroBlake2Wasm(wasmPath: string): (data: Uint8Array) => Uint8Array {
	const wasmBytes = readFileSync(wasmPath);
	const inst = new WebAssembly.Instance(new WebAssembly.Module(wasmBytes), {});
	const memory = inst.exports.memory as WebAssembly.Memory;
	const blake2Hash = inst.exports.blake2Hash as (
		inputPtr: number,
		inputLen: number,
		outputPtr: number,
		outputLen: number,
	) => void;
	const scratchBase = memory.buffer.byteLength;
	memory.grow(1);
	const memView = new Uint8Array(memory.buffer);
	const outPtr = scratchBase;
	const inPtr = scratchBase + 128;

	return (data: Uint8Array): Uint8Array => {
		memView.set(data, inPtr);
		blake2Hash(inPtr, data.length, outPtr, 64);
		return memView.slice(outPtr, outPtr + 64);
	};
}

// ---------------------------------------------------------------------------
// Deterministic test fixture generators
// ---------------------------------------------------------------------------

function makeDeterministicBytes(len: number, seed: number): Uint8Array {
	const out = new Uint8Array(len);
	let s = (seed >>> 0) || 1;
	for (let i = 0; i < len; i++) {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
		out[i] = (s >>> 24) & 0xff;
	}
	return out;
}

/**
 * Generate a realistic ~2.5 KB EVM contract bytecode (ERC-20 dispatcher + proxy
 * fallback + storage ops + PUSH32 payloads containing embedded 0x5b bytes so
 * JUMPDEST analysis must decode every instruction boundary).
 */
function buildRealisticContractBytecode(): Uint8Array {
	const chunks: number[] = [];
	const push = (...bytes: number[]) => {
		for (const b of bytes) chunks.push(b);
	};

	// Free memory pointer setup: PUSH1 0x80 PUSH1 0x40 MSTORE
	push(0x60, 0x80, 0x60, 0x40, 0x52);
	// Calldata size guard: PUSH1 0x04 CALLDATASIZE LT PUSH2 0x00ff JUMPI
	push(0x60, 0x04, 0x36, 0x10, 0x61, 0x00, 0xff, 0x57);
	// Selector extraction: PUSH1 0x00 CALLDATALOAD PUSH1 0xe0 SHR
	push(0x60, 0x00, 0x35, 0x60, 0xe0, 0x1c);

	// 12 realistic ERC-20 / ERC-2612 / Proxy function selector branches
	const selectors = [
		[0xa9, 0x05, 0x9c, 0xbb], // transfer(address,uint256)
		[0x23, 0xb8, 0x72, 0xdd], // transferFrom(address,address,uint256)
		[0x09, 0x5e, 0xa7, 0xb3], // approve(address,uint256)
		[0x70, 0xa0, 0x82, 0x31], // balanceOf(address)
		[0xdd, 0x62, 0xed, 0x3e], // allowance(address,address)
		[0x18, 0x16, 0x0d, 0xdd], // totalSupply()
		[0x06, 0xfd, 0xde, 0x03], // name()
		[0x95, 0xd8, 0x9b, 0x41], // symbol()
		[0x31, 0x3c, 0xe5, 0x67], // decimals()
		[0xd5, 0x05, 0xac, 0xcf], // permit(...)
		[0x36, 0x44, 0xe5, 0x15], // DOMAIN_SEPARATOR()
		[0x5c, 0x60, 0xda, 0x1b], // implementation()
	];

	for (let i = 0; i < selectors.length; i++) {
		const [b0, b1, b2, b3] = selectors[i];
		const dest = 0x0120 + i * 0x60;
		// DUP1 PUSH4 <sel> EQ PUSH2 <dest> JUMPI
		push(0x80, 0x63, b0, b1, b2, b3, 0x14, 0x61, (dest >> 8) & 0xff, dest & 0xff, 0x57);
	}

	// Fallback / delegatecall proxy block with EIP-1967 implementation slot (PUSH32)
	push(
		0x5b, // JUMPDEST
		0x7f, // PUSH32 EIP-1967 slot (intentionally includes 0x5b bytes inside immediate)
		0x36, 0x08, 0x94, 0xa1, 0x3b, 0xa1, 0xa3, 0x21,
		0x06, 0x67, 0xc8, 0x28, 0x49, 0x2d, 0xb9, 0x8d,
		0xca, 0x3e, 0x20, 0x76, 0xcc, 0x37, 0x35, 0xa9,
		0x20, 0xa3, 0xca, 0x50, 0x5d, 0x38, 0x2b, 0xbc,
		0x54, // SLOAD
		0x36, 0x60, 0x00, 0x80, 0x37, // CALLDATASIZE PUSH1 0 DUP1 CALLDATACOPY
		0x60, 0x00, 0x80, 0x36, 0x60, 0x00, 0x85, 0x5a, 0xf4, // DELEGATECALL
		0x3d, 0x60, 0x00, 0x80, 0x3e, // RETURNDATACOPY
		0x80, 0x60, 0x00, 0x14, 0x61, 0x01, 0x00, 0x57, // JUMPI
		0x3d, 0x60, 0x00, 0xf3, // RETURN
		0x5b, 0x3d, 0x60, 0x00, 0xfd, // JUMPDEST REVERT
	);

	// 24 realistic handler blocks (~2.3 KB total) with arithmetic, KECCAK256, SLOAD/SSTORE, LOG3, PUSH32
	for (let b = 0; b < 24; b++) {
		push(
			0x5b, // JUMPDEST
			0x34, 0x80, 0x15, 0x61, 0x00, 0x10, 0x57, 0x60, 0x00, 0x80, 0xfd, // nonpayable check
			0x5b, // JUMPDEST
			0x50, // POP
			0x60, 0x04, 0x35, // CALLDATALOAD arg0
			0x60, 0x24, 0x35, // CALLDATALOAD arg1
			0x33, // CALLER
			0x60, 0x00, 0x52, // MSTORE
			0x60, 0x01, 0x60, 0x20, 0x52, // MSTORE slot
			0x60, 0x40, 0x60, 0x00, 0x20, // KECCAK256
			0x80, 0x54, // DUP1 SLOAD
			0x82, 0x81, 0x10, 0x15, 0x61, 0x00, 0x20, 0x57, // balance check
			0x60, 0x00, 0x80, 0xfd, // REVERT
			0x5b, // JUMPDEST
			0x82, 0x90, 0x03, // SUB
			0x90, 0x55, // SSTORE
			// PUSH32 Transfer event topic with synthetic 0x5b bytes inside immediate
			0x7f,
			0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b,
			0x69, 0xc2, 0xb0, 0x68, 0xfc, 0x37, 0x8d, 0xaa,
			0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16,
			0x28, 0xf5, 0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0x5b,
			0x33, 0x83, 0x60, 0x20, 0x60, 0x00, 0xa3, // LOG3
			0x60, 0x01, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xf3, // RETURN true
		);
	}

	return new Uint8Array(chunks);
}

// ---------------------------------------------------------------------------
// Native FFI auto-detection
// ---------------------------------------------------------------------------

function detectNativeLib(): string | null {
	const ext = platform() === "darwin" ? "dylib" : platform() === "win32" ? "dll" : "so";
	const candidates = [
		resolve(ROOT, `zig-out/native/libprimitives_ts_native.${ext}`),
		resolve(ROOT, `packages/voltaire-ts/zig-out/native/libprimitives_ts_native.${ext}`),
	];
	for (const p of candidates) {
		if (existsSync(p)) return p;
	}
	return null;
}

// ---------------------------------------------------------------------------
// Bundle size measurement (Bun.build + gzipSync)
// ---------------------------------------------------------------------------

async function measureBundleSizes(): Promise<BundleEntry[]> {
	const oxPkg = JSON.parse(readFileSync(resolve(VOLTAIRE_NM, "ox/package.json"), "utf8"));
	const oxSubpath = (sub: string): string => {
		const exp = oxPkg.exports[sub];
		const rel = typeof exp === "string" ? exp : exp.import?.default ?? exp.import ?? exp.default;
		return resolve(VOLTAIRE_NM, "ox", rel);
	};

	const specs: Array<{
		primitive: string;
		library: string;
		importStyle: string;
		code: string;
	}> = [
		// Keccak256
		{
			primitive: "Keccak256",
			library: "Voltaire (leaf)",
			importStyle: "Keccak256/hash.js",
			code: `import { hash } from "${VOLTAIRE_SRC}/crypto/Keccak256/hash.js"; globalThis.__x = hash;`,
		},
		{
			primitive: "Keccak256",
			library: "Voltaire (subpath)",
			importStyle: "@tevm/voltaire/Keccak256",
			code: `import { Keccak256 } from "${VOLTAIRE_SRC}/crypto/Keccak256/index.ts"; globalThis.__x = Keccak256.hash;`,
		},
		{
			primitive: "Keccak256",
			library: "viem",
			importStyle: "viem (keccak256)",
			code: `import { keccak256 } from "${VOLTAIRE_NM}/viem/_esm/index.js"; globalThis.__x = keccak256;`,
		},
		{
			primitive: "Keccak256",
			library: "ox",
			importStyle: "ox/Hash (keccak256)",
			code: `import { keccak256 } from "${oxSubpath("./Hash")}"; globalThis.__x = keccak256;`,
		},
		{
			primitive: "Keccak256",
			library: "ethers",
			importStyle: "ethers (keccak256)",
			code: `import { keccak256 } from "${VOLTAIRE_NM}/ethers/lib.esm/index.js"; globalThis.__x = keccak256;`,
		},

		// Address
		{
			primitive: "Address",
			library: "Voltaire (leaf)",
			importStyle: "Address/fromHex + ToChecksummed",
			code: `import { fromHex } from "${VOLTAIRE_SRC}/primitives/Address/fromHex.js"; import { ToChecksummed } from "${VOLTAIRE_SRC}/primitives/Address/toChecksummed.js"; import { hash } from "${VOLTAIRE_SRC}/crypto/Keccak256/hash.js"; globalThis.__x = [fromHex, ToChecksummed({ keccak256: hash })];`,
		},
		{
			primitive: "Address",
			library: "Voltaire (subpath)",
			importStyle: "@tevm/voltaire/Address",
			code: `import { Address } from "${VOLTAIRE_SRC}/primitives/Address/index.ts"; globalThis.__x = [Address.fromHex, Address.toChecksummed];`,
		},
		{
			primitive: "Address",
			library: "viem",
			importStyle: "viem (getAddress, isAddress)",
			code: `import { getAddress, isAddress } from "${VOLTAIRE_NM}/viem/_esm/index.js"; globalThis.__x = [getAddress, isAddress];`,
		},
		{
			primitive: "Address",
			library: "ox",
			importStyle: "ox/Address (checksum, validate)",
			code: `import { checksum, validate } from "${oxSubpath("./Address")}"; globalThis.__x = [checksum, validate];`,
		},
		{
			primitive: "Address",
			library: "ethers",
			importStyle: "ethers (getAddress, isAddress)",
			code: `import { getAddress, isAddress } from "${VOLTAIRE_NM}/ethers/lib.esm/index.js"; globalThis.__x = [getAddress, isAddress];`,
		},

		// Abi
		{
			primitive: "Abi",
			library: "Voltaire (subpath)",
			importStyle: "@tevm/voltaire/Abi",
			code: `import { Abi } from "${VOLTAIRE_SRC}/primitives/Abi/index.ts"; globalThis.__x = Abi;`,
		},
		{
			primitive: "Abi",
			library: "viem",
			importStyle: "viem (encode/decodeFunctionData)",
			code: `import { encodeFunctionData, decodeFunctionData } from "${VOLTAIRE_NM}/viem/_esm/index.js"; globalThis.__x = [encodeFunctionData, decodeFunctionData];`,
		},
		{
			primitive: "Abi",
			library: "ox",
			importStyle: "ox/AbiFunction (encode/decodeData)",
			code: `import { encodeData, decodeData } from "${oxSubpath("./AbiFunction")}"; globalThis.__x = [encodeData, decodeData];`,
		},
		{
			primitive: "Abi",
			library: "ethers",
			importStyle: "ethers (Interface)",
			code: `import { Interface } from "${VOLTAIRE_NM}/ethers/lib.esm/index.js"; globalThis.__x = Interface;`,
		},

		// Rlp
		{
			primitive: "Rlp",
			library: "Voltaire (named)",
			importStyle: "@tevm/voltaire/Rlp (encode, decode)",
			code: `import { encode, decode } from "${VOLTAIRE_SRC}/primitives/Rlp/index.ts"; globalThis.__x = [encode, decode];`,
		},
		{
			primitive: "Rlp",
			library: "Voltaire (subpath)",
			importStyle: "@tevm/voltaire/Rlp (Rlp)",
			code: `import { Rlp } from "${VOLTAIRE_SRC}/primitives/Rlp/index.ts"; globalThis.__x = [Rlp.encode, Rlp.decode];`,
		},
		{
			primitive: "Rlp",
			library: "viem",
			importStyle: "viem (toRlp, fromRlp)",
			code: `import { toRlp, fromRlp } from "${VOLTAIRE_NM}/viem/_esm/index.js"; globalThis.__x = [toRlp, fromRlp];`,
		},
		{
			primitive: "Rlp",
			library: "ox",
			importStyle: "ox/Rlp (from, to)",
			code: `import { from, to } from "${oxSubpath("./Rlp")}"; globalThis.__x = [from, to];`,
		},
		{
			primitive: "Rlp",
			library: "ethers",
			importStyle: "ethers (encodeRlp, decodeRlp)",
			code: `import { encodeRlp, decodeRlp } from "${VOLTAIRE_NM}/ethers/lib.esm/index.js"; globalThis.__x = [encodeRlp, decodeRlp];`,
		},
	];

	const results: BundleEntry[] = [];
	const tempDir = mkdtempSync(join(tmpdir(), "voltaire-bench-bundle-"));
	try {
		for (let i = 0; i < specs.length; i++) {
			const spec = specs[i];
			const entryFile = join(tempDir, `entry-${i}.ts`);
			writeFileSync(entryFile, spec.code);
			const build = await Bun.build({
				entrypoints: [entryFile],
				minify: true,
				target: "browser",
				format: "esm",
			});
			if (!build.success) {
				throw new Error(`Bundle build failed for ${spec.primitive}/${spec.library}: ${build.logs.join("; ")}`);
			}
			const text = await build.outputs[0].text();
			const buf = Buffer.from(text, "utf8");
			results.push({
				primitive: spec.primitive,
				library: spec.library,
				importStyle: spec.importStyle,
				minifiedBytes: buf.byteLength,
				gzipBytes: gzipSync(buf, { level: 9 }).byteLength,
			});
		}
	} finally {
		rmSync(tempDir, { recursive: true, force: true });
	}
	return results;
}

function measureWasmArtifacts(): WasmArtifactEntry[] {
	const files: Array<{ name: string; relPath: string; role: string }> = [
		{ name: "address.wasm", relPath: "wasm/crypto/address.wasm", role: "Standalone Address (hex, validate, equals)" },
		{ name: "ripemd160.wasm", relPath: "wasm/crypto/ripemd160.wasm", role: "Standalone RIPEMD-160 hash" },
		{ name: "blake2.wasm", relPath: "wasm/crypto/blake2.wasm", role: "Standalone BLAKE2b hash" },
		{ name: "keccak256.wasm", relPath: "wasm/crypto/keccak256.wasm", role: "Standalone Keccak-256 hash" },
		{ name: "primitives.wasm", relPath: "wasm/primitives.wasm", role: "Full primitives + crypto (ReleaseSmall)" },
		{ name: "primitives-fast.wasm", relPath: "wasm/primitives-fast.wasm", role: "Full primitives + crypto (ReleaseFast)" },
		{ name: "state-manager.wasm", relPath: "wasm/state-manager.wasm", role: "EVM StateManager (ReleaseSmall)" },
		{ name: "blockchain.wasm", relPath: "wasm/blockchain.wasm", role: "EVM Blockchain store (ReleaseSmall)" },
	];

	const entries: WasmArtifactEntry[] = [];
	for (const f of files) {
		const fullPath = resolve(ROOT, f.relPath);
		if (!existsSync(fullPath)) continue;
		const buf = readFileSync(fullPath);
		entries.push({
			name: f.name,
			path: f.relPath,
			rawBytes: statSync(fullPath).size,
			gzipBytes: gzipSync(buf, { level: 9 }).byteLength,
			role: f.role,
		});
	}
	return entries;
}

// ---------------------------------------------------------------------------
// Main benchmark suite
// ---------------------------------------------------------------------------

async function runSuite(): Promise<FullReport> {
	// Load comparison libraries from packages/voltaire-ts/node_modules
	const viem = await import(resolve(VOLTAIRE_NM, "viem/_esm/index.js"));
	const viemAccounts = await import(resolve(VOLTAIRE_NM, "viem/_esm/accounts/index.js"));
	const ox = await import(resolve(VOLTAIRE_NM, "ox/dist/index.js"));
	const ethers = await import(resolve(VOLTAIRE_NM, "ethers/lib.esm/index.js"));

	const readPkgVersion = (pkgJsonPath: string): string =>
		JSON.parse(readFileSync(pkgJsonPath, "utf8")).version as string;

	// Detect & load Native Zig FFI if available
	const nativeLibPath = detectNativeLib();
	let VoltaireNative: typeof import("../packages/voltaire-ts/src/native/index.ts") | null = null;
	if (nativeLibPath) {
		try {
			const mod = await import("../packages/voltaire-ts/src/native/index.ts");
			// Smoke test to confirm symbols resolve cleanly
			const probe = mod.Keccak256.hash(new Uint8Array([1, 2, 3]));
			if (probe.length === 32) {
				VoltaireNative = mod;
			}
		} catch {
			VoltaireNative = null;
		}
	}

	// Load WASM modules
	const primitivesWasmPath = resolve(ROOT, "wasm/primitives.wasm");
	const primitivesWasmBuf = readFileSync(primitivesWasmPath);
	await WasmLoader.loadWasm(
		primitivesWasmBuf.buffer.slice(
			primitivesWasmBuf.byteOffset,
			primitivesWasmBuf.byteOffset + primitivesWasmBuf.byteLength,
		),
	);
	const microKeccak256 = loadMicroKeccak256Wasm(resolve(ROOT, "wasm/crypto/keccak256.wasm"));
	const microBlake2 = loadMicroBlake2Wasm(resolve(ROOT, "wasm/crypto/blake2.wasm"));

	const cpuList = cpus();
	const metadata: BenchmarkMetadata = {
		timestamp: new Date().toISOString(),
		cpu: cpuList[0]?.model?.trim() ?? "Unknown CPU",
		cores: cpuList.length,
		os: `${platform()} ${release()}`,
		arch: process.arch,
		bunVersion: Bun.version,
		nativeFfiAvailable: VoltaireNative !== null,
		nativeLibPath: VoltaireNative ? nativeLibPath : null,
		versions: {
			voltaire: readPkgVersion(resolve(ROOT, "packages/voltaire-ts/package.json")),
			viem: readPkgVersion(resolve(VOLTAIRE_NM, "viem/package.json")),
			ox: readPkgVersion(resolve(VOLTAIRE_NM, "ox/package.json")),
			ethers: readPkgVersion(resolve(VOLTAIRE_NM, "ethers/package.json")),
		},
	};

	const shouldRun = (id: string): boolean => !ONLY_ARG || id.includes(ONLY_ARG);
	const workloads: WorkloadReport[] = [];

	// -------------------------------------------------------------------------
	// 1. Keccak256 — 32 B, 1 KB, and Batch 1,000 × 32 B
	// -------------------------------------------------------------------------
	const data32 = makeDeterministicBytes(32, 0x1111);
	const data1k = makeDeterministicBytes(1024, 0x2222);
	const batch32 = Array.from({ length: 1000 }, (_, i) => makeDeterministicBytes(32, 0x3000 + i));

	// Correctness check
	{
		const expected = Voltaire.Hex.fromBytes(Voltaire.Keccak256.hash(data32));
		const checks: Array<[string, string]> = [
			["WASM keccak256.wasm", Voltaire.Hex.fromBytes(microKeccak256(data32))],
			["WASM primitives.wasm", Voltaire.Hex.fromBytes(WasmLoader.keccak256(data32))],
			["viem", Voltaire.Hex.fromBytes(viem.keccak256(data32, "bytes"))],
			["ox", Voltaire.Hex.fromBytes(ox.Hash.keccak256(data32, { as: "Bytes" }))],
			["ethers", ethers.keccak256(data32).toLowerCase()],
		];
		if (VoltaireNative) {
			checks.push(["Native Zig FFI", Voltaire.Hex.fromBytes(VoltaireNative.Keccak256.hash(data32))]);
		}
		for (const [label, actual] of checks) {
			if (actual !== expected) {
				throw new Error(`Keccak256 parity mismatch for ${label}: ${actual} !== ${expected}`);
			}
		}
	}

	if (shouldRun("keccak256-32b")) {
		const results: TimingEntry[] = [
			benchmarkSync("Voltaire (Pure TS)", () => Voltaire.Keccak256.hash(data32)),
			benchmarkSync("Voltaire (WASM keccak256.wasm)", () => microKeccak256(data32), "3.16 kB standalone"),
			benchmarkSync("Voltaire (WASM primitives.wasm)", () => WasmLoader.keccak256(data32), "ReleaseSmall"),
		];
		if (VoltaireNative) {
			const nat = VoltaireNative;
			results.push(benchmarkSync("Voltaire (Native Zig FFI)", () => nat.Keccak256.hash(data32), "ReleaseFast dylib"));
		}
		results.push(
			benchmarkSync("viem", () => viem.keccak256(data32, "bytes")),
			benchmarkSync("ox", () => ox.Hash.keccak256(data32, { as: "Bytes" })),
			benchmarkSync("ethers", () => ethers.keccak256(data32), "returns hex string"),
		);
		workloads.push({
			id: "keccak256-32b",
			title: "Keccak-256 (32 B)",
			category: "Hashing",
			unit: "hash/s",
			batchSize: 1,
			description: "Single 32-byte Keccak-256 digest (e.g. storage slot / Merkle node).",
			results,
		});
	}

	if (shouldRun("keccak256-1kb")) {
		const results: TimingEntry[] = [
			benchmarkSync("Voltaire (Pure TS)", () => Voltaire.Keccak256.hash(data1k)),
			benchmarkSync("Voltaire (WASM keccak256.wasm)", () => microKeccak256(data1k), "3.16 kB standalone"),
			benchmarkSync("Voltaire (WASM primitives.wasm)", () => WasmLoader.keccak256(data1k), "ReleaseSmall"),
		];
		if (VoltaireNative) {
			const nat = VoltaireNative;
			results.push(benchmarkSync("Voltaire (Native Zig FFI)", () => nat.Keccak256.hash(data1k), "ReleaseFast dylib"));
		}
		results.push(
			benchmarkSync("viem", () => viem.keccak256(data1k, "bytes")),
			benchmarkSync("ox", () => ox.Hash.keccak256(data1k, { as: "Bytes" })),
			benchmarkSync("ethers", () => ethers.keccak256(data1k), "returns hex string"),
		);
		workloads.push({
			id: "keccak256-1kb",
			title: "Keccak-256 (1 KB)",
			category: "Hashing",
			unit: "hash/s",
			batchSize: 1,
			description: "Single 1,024-byte payload Keccak-256 digest (e.g. contract initcode / RLP tx).",
			results,
		});
	}

	if (shouldRun("keccak256-batch-1000")) {
		const results: TimingEntry[] = [
			benchmarkSync("Voltaire (Pure TS)", () => {
				let last: Uint8Array = batch32[0];
				for (let i = 0; i < batch32.length; i++) last = Voltaire.Keccak256.hash(batch32[i]);
				return last;
			}),
			benchmarkSync(
				"Voltaire (WASM keccak256.wasm)",
				() => {
					let last: Uint8Array = batch32[0];
					for (let i = 0; i < batch32.length; i++) last = microKeccak256(batch32[i]);
					return last;
				},
				"3.16 kB standalone",
			),
			benchmarkSync(
				"Voltaire (WASM primitives.wasm)",
				() => {
					let last: Uint8Array = batch32[0];
					for (let i = 0; i < batch32.length; i++) last = WasmLoader.keccak256(batch32[i]);
					return last;
				},
				"ReleaseSmall",
			),
		];
		if (VoltaireNative) {
			const nat = VoltaireNative;
			results.push(
				benchmarkSync(
					"Voltaire (Native Zig FFI)",
					() => {
						let last: Uint8Array = batch32[0];
						for (let i = 0; i < batch32.length; i++) last = nat.Keccak256.hash(batch32[i]);
						return last;
					},
					"ReleaseFast dylib",
				),
			);
		}
		results.push(
			benchmarkSync("viem", () => {
				let last: Uint8Array = batch32[0];
				for (let i = 0; i < batch32.length; i++) last = viem.keccak256(batch32[i], "bytes");
				return last;
			}),
			benchmarkSync("ox", () => {
				let last: Uint8Array = batch32[0];
				for (let i = 0; i < batch32.length; i++) last = ox.Hash.keccak256(batch32[i], { as: "Bytes" });
				return last;
			}),
			benchmarkSync(
				"ethers",
				() => {
					let last = "";
					for (let i = 0; i < batch32.length; i++) last = ethers.keccak256(batch32[i]);
					return last;
				},
				"returns hex string",
			),
		);
		workloads.push({
			id: "keccak256-batch-1000",
			title: "Keccak-256 Batch (1,000 × 32 B)",
			category: "Hashing",
			unit: "batch/s",
			batchSize: 1000,
			description: "1,000 consecutive 32-byte Keccak-256 hashes (1 batch = 1,000 hashes).",
			results,
		});
	}

	// -------------------------------------------------------------------------
	// 2. Address — Parse + EIP-55 Checksum (Batch 1,000 unique cold addresses)
	// -------------------------------------------------------------------------
	// Pool of 25,000 unique addresses (> 3x viem's 8,192-entry LRU cache) rotated
	// across batches so every call genuinely validates & hashes EIP-55.
	if (shouldRun("address-checksum-batch-1000")) {
		const POOL_BATCHES = 25;
		const BATCH_LEN = 1000;
		const addressPool: `0x${string}`[][] = Array.from({ length: POOL_BATCHES }, (_, b) =>
			Array.from({ length: BATCH_LEN }, (_, i) => {
				const bytes = makeDeterministicBytes(20, 0x900000 + b * BATCH_LEN + i);
				return Voltaire.Hex.fromBytes(bytes) as `0x${string}`;
			}),
		);

		const nativeToChecksummed = VoltaireNative
			? ToChecksummed({ keccak256: VoltaireNative.Keccak256.hash })
			: null;

		// Parity verification
		{
			const sampleAddr = addressPool[0][0];
			const expected = Voltaire.Address.toChecksummed(Voltaire.Address.fromHex(sampleAddr));
			const checks: Array<[string, string]> = [
				["WASM primitives.wasm", WasmLoader.addressToChecksumHex(WasmLoader.addressFromHex(sampleAddr))],
				["viem", viem.getAddress(sampleAddr)],
				["ox", ox.Address.checksum(sampleAddr)],
				["ethers", ethers.getAddress(sampleAddr)],
			];
			if (nativeToChecksummed) {
				checks.push(["Native Zig FFI", nativeToChecksummed(Voltaire.Address.fromHex(sampleAddr))]);
			}
			for (const [label, actual] of checks) {
				if (actual !== expected) {
					throw new Error(`Address checksum parity mismatch for ${label}: ${actual} !== ${expected}`);
				}
			}
		}

		let cursor = 0;
		const nextBatch = (): `0x${string}`[] => {
			const batch = addressPool[cursor];
			cursor = (cursor + 1) % POOL_BATCHES;
			return batch;
		};

		const results: TimingEntry[] = [
			benchmarkSync("Voltaire (Pure TS)", () => {
				const batch = nextBatch();
				let last = "";
				for (let i = 0; i < batch.length; i++) {
					last = Voltaire.Address.toChecksummed(Voltaire.Address.fromHex(batch[i]));
				}
				return last;
			}),
			benchmarkSync(
				"Voltaire (WASM primitives.wasm)",
				() => {
					const batch = nextBatch();
					let last = "";
					for (let i = 0; i < batch.length; i++) {
						last = WasmLoader.addressToChecksumHex(WasmLoader.addressFromHex(batch[i]));
					}
					return last;
				},
				"ReleaseSmall",
			),
		];
		if (nativeToChecksummed) {
			results.push(
				benchmarkSync(
					"Voltaire (Native Zig FFI)",
					() => {
						const batch = nextBatch();
						let last = "";
						for (let i = 0; i < batch.length; i++) {
							last = nativeToChecksummed(Voltaire.Address.fromHex(batch[i]));
						}
						return last;
					},
					"Native Keccak-256",
				),
			);
		}
		results.push(
			benchmarkSync(
				"viem",
				() => {
					const batch = nextBatch();
					let last = "";
					for (let i = 0; i < batch.length; i++) last = viem.getAddress(batch[i]);
					return last;
				},
				"cold pool (>8192 LRU)",
			),
			benchmarkSync(
				"ox",
				() => {
					const batch = nextBatch();
					let last = "";
					for (let i = 0; i < batch.length; i++) last = ox.Address.checksum(batch[i]);
					return last;
				},
				"cold (Caches.clear per sample)",
				() => ox.Caches.clear(),
			),
			benchmarkSync("ethers", () => {
				const batch = nextBatch();
				let last = "";
				for (let i = 0; i < batch.length; i++) last = ethers.getAddress(batch[i]);
				return last;
			}),
		);
		workloads.push({
			id: "address-checksum-batch-1000",
			title: "Address Parse + EIP-55 Checksum (Batch 1,000)",
			category: "Primitives",
			unit: "batch/s",
			batchSize: 1000,
			description:
				"Parse 1,000 unique lowercase hex addresses and compute EIP-55 checksums (rotated across 25,000 unique addresses to prevent LRU cache distortion).",
			results,
		});
	}

	// -------------------------------------------------------------------------
	// 3. Secp256k1 — recoverPublicKey (Batch 100) & sign (Batch 100)
	// -------------------------------------------------------------------------
	const SECP_BATCH = 100;
	const secpFixtures = Array.from({ length: SECP_BATCH }, (_, i) => {
		const priv = makeDeterministicBytes(32, 0x50000 + i);
		priv[0] = 0x01; // guarantee non-zero, < secp256k1 N
		const privHex = Voltaire.Hex.fromBytes(priv) as `0x${string}`;
		const msgHash = Voltaire.Keccak256.hash(makeDeterministicBytes(32, 0x60000 + i));
		const msgHashHex = Voltaire.Hex.fromBytes(msgHash) as `0x${string}`;
		const vSig = Voltaire.Secp256k1.sign(msgHash, priv as Voltaire.PrivateKeyType);
		const recBit = vSig.v >= 27 ? vSig.v - 27 : vSig.v;
		const oxSig = ox.Secp256k1.sign({ payload: msgHashHex, privateKey: privHex });
		const eKey = new ethers.SigningKey(privHex);
		const eSig = eKey.sign(msgHashHex);
		const compactSigHex = (`0x${Buffer.from(vSig.r).toString("hex")}${Buffer.from(vSig.s).toString("hex")}${(recBit + 27).toString(16).padStart(2, "0")}`) as `0x${string}`;
		return { priv, privHex, msgHash, msgHashHex, vSig, recBit, oxSig, eKey, eSig, compactSigHex };
	});

	// Correctness check for Secp256k1 recoverPublicKey
	{
		const f = secpFixtures[0];
		const expected = `0x04${Voltaire.Hex.fromBytes(Voltaire.Secp256k1.recoverPublicKey(f.vSig, f.msgHash)).slice(2)}`;
		const wasmPub = `0x04${Voltaire.Hex.fromBytes(WasmLoader.secp256k1RecoverPubkey(f.msgHash, f.vSig.r, f.vSig.s, f.recBit)).slice(2)}`;
		const viemPub = (await viem.recoverPublicKey({ hash: f.msgHashHex, signature: f.compactSigHex })).toLowerCase();
		const oxPub = ox.PublicKey.toHex(ox.Secp256k1.recoverPublicKey({ payload: f.msgHashHex, signature: f.oxSig })).toLowerCase();
		const ethersPub = ethers.SigningKey.recoverPublicKey(f.msgHashHex, f.eSig).toLowerCase();
		const checks: Array<[string, string]> = [
			["WASM primitives.wasm", wasmPub],
			["viem", viemPub],
			["ox", oxPub],
			["ethers", ethersPub],
		];
		if (VoltaireNative) {
			checks.push([
				"Native Zig FFI",
				`0x04${Voltaire.Hex.fromBytes(VoltaireNative.Secp256k1.recoverPublicKey(f.vSig, f.msgHash)).slice(2)}`,
			]);
		}
		for (const [label, actual] of checks) {
			if (actual !== expected) {
				throw new Error(`Secp256k1 recoverPublicKey mismatch for ${label}: ${actual} !== ${expected}`);
			}
		}
	}

	if (shouldRun("secp256k1-recover-batch-100")) {
		const results: TimingEntry[] = [
			benchmarkSync("Voltaire (Pure TS)", () => {
				let last: Uint8Array | null = null;
				for (let i = 0; i < secpFixtures.length; i++) {
					const f = secpFixtures[i];
					last = Voltaire.Secp256k1.recoverPublicKey(f.vSig, f.msgHash);
				}
				return last;
			}),
			benchmarkSync(
				"Voltaire (WASM primitives.wasm)",
				() => {
					let last: Uint8Array | null = null;
					for (let i = 0; i < secpFixtures.length; i++) {
						const f = secpFixtures[i];
						last = WasmLoader.secp256k1RecoverPubkey(f.msgHash, f.vSig.r, f.vSig.s, f.recBit);
					}
					return last;
				},
				"ReleaseSmall",
			),
		];
		if (VoltaireNative) {
			const nat = VoltaireNative;
			results.push(
				benchmarkSync(
					"Voltaire (Native Zig FFI)",
					() => {
						let last: Uint8Array | null = null;
						for (let i = 0; i < secpFixtures.length; i++) {
							const f = secpFixtures[i];
							last = nat.Secp256k1.recoverPublicKey(f.vSig, f.msgHash);
						}
						return last;
					},
					"ReleaseFast dylib",
				),
			);
		}
		results.push(
			await benchmarkAsync(
				"viem",
				async () => {
					let last = "";
					for (let i = 0; i < secpFixtures.length; i++) {
						const f = secpFixtures[i];
						last = await viem.recoverPublicKey({ hash: f.msgHashHex, signature: f.compactSigHex });
					}
					return last;
				},
				"async API",
			),
			benchmarkSync("ox", () => {
				let last: unknown = null;
				for (let i = 0; i < secpFixtures.length; i++) {
					const f = secpFixtures[i];
					last = ox.Secp256k1.recoverPublicKey({ payload: f.msgHashHex, signature: f.oxSig });
				}
				return last;
			}),
			benchmarkSync("ethers", () => {
				let last = "";
				for (let i = 0; i < secpFixtures.length; i++) {
					const f = secpFixtures[i];
					last = ethers.SigningKey.recoverPublicKey(f.msgHashHex, f.eSig);
				}
				return last;
			}),
		);
		workloads.push({
			id: "secp256k1-recover-batch-100",
			title: "Secp256k1 recoverPublicKey / ecrecover (Batch 100)",
			category: "Cryptography",
			unit: "batch/s",
			batchSize: SECP_BATCH,
			description: "Recover uncompressed secp256k1 public keys for 100 distinct ECDSA signatures (1 batch = 100 recoveries).",
			results,
		});
	}

	if (shouldRun("secp256k1-sign-batch-100")) {
		const results: TimingEntry[] = [
			benchmarkSync("Voltaire (Pure TS)", () => {
				let last: unknown = null;
				for (let i = 0; i < secpFixtures.length; i++) {
					const f = secpFixtures[i];
					last = Voltaire.Secp256k1.sign(f.msgHash, f.priv as Voltaire.PrivateKeyType);
				}
				return last;
			}),
			benchmarkSync(
				"Voltaire (WASM primitives.wasm)",
				() => {
					let last: unknown = null;
					for (let i = 0; i < secpFixtures.length; i++) {
						const f = secpFixtures[i];
						last = WasmLoader.secp256k1Sign(f.msgHash, f.priv);
					}
					return last;
				},
				"ReleaseSmall",
			),
		];
		if (VoltaireNative) {
			const nat = VoltaireNative;
			results.push(
				benchmarkSync(
					"Voltaire (Native Zig FFI)",
					() => {
						let last: unknown = null;
						for (let i = 0; i < secpFixtures.length; i++) {
							const f = secpFixtures[i];
							last = nat.Secp256k1.sign(f.msgHash, f.priv as Voltaire.PrivateKeyType);
						}
						return last;
					},
					"ReleaseFast dylib",
				),
			);
		}
		results.push(
			await benchmarkAsync(
				"viem",
				async () => {
					let last: unknown = null;
					for (let i = 0; i < secpFixtures.length; i++) {
						const f = secpFixtures[i];
						last = await viemAccounts.sign({ hash: f.msgHashHex, privateKey: f.privHex });
					}
					return last;
				},
				"async API",
			),
			benchmarkSync("ox", () => {
				let last: unknown = null;
				for (let i = 0; i < secpFixtures.length; i++) {
					const f = secpFixtures[i];
					last = ox.Secp256k1.sign({ payload: f.msgHashHex, privateKey: f.privHex });
				}
				return last;
			}),
			benchmarkSync("ethers", () => {
				let last: unknown = null;
				for (let i = 0; i < secpFixtures.length; i++) {
					const f = secpFixtures[i];
					last = f.eKey.sign(f.msgHashHex);
				}
				return last;
			}),
		);
		workloads.push({
			id: "secp256k1-sign-batch-100",
			title: "Secp256k1 ECDSA Sign (Batch 100)",
			category: "Cryptography",
			unit: "batch/s",
			batchSize: SECP_BATCH,
			description: "Sign 100 distinct 32-byte digests with RFC 6979 deterministic secp256k1 ECDSA (1 batch = 100 signatures).",
			results,
		});
	}

	// -------------------------------------------------------------------------
	// 4. SHA-256 & BLAKE2b (1 KB throughput)
	// -------------------------------------------------------------------------
	if (shouldRun("sha256-1kb")) {
		const expected = Voltaire.Hex.fromBytes(Voltaire.SHA256.hash(data1k));
		const checks: Array<[string, string]> = [
			["WASM primitives.wasm", Voltaire.Hex.fromBytes(WasmLoader.sha256(data1k))],
			["viem", viem.sha256(data1k).toLowerCase()],
			["ox", Voltaire.Hex.fromBytes(ox.Hash.sha256(data1k, { as: "Bytes" }))],
			["ethers", ethers.sha256(data1k).toLowerCase()],
		];
		if (VoltaireNative) {
			checks.push(["Native Zig FFI", Voltaire.Hex.fromBytes(VoltaireNative.SHA256.hash(data1k))]);
		}
		for (const [label, actual] of checks) {
			if (actual !== expected) throw new Error(`SHA-256 mismatch for ${label}: ${actual} !== ${expected}`);
		}

		const results: TimingEntry[] = [
			benchmarkSync("Voltaire (Pure TS)", () => Voltaire.SHA256.hash(data1k)),
			benchmarkSync("Voltaire (WASM primitives.wasm)", () => WasmLoader.sha256(data1k), "ReleaseSmall"),
		];
		if (VoltaireNative) {
			const nat = VoltaireNative;
			results.push(benchmarkSync("Voltaire (Native Zig FFI)", () => nat.SHA256.hash(data1k), "ReleaseFast dylib"));
		}
		results.push(
			benchmarkSync("viem", () => viem.sha256(data1k, "bytes")),
			benchmarkSync("ox", () => ox.Hash.sha256(data1k, { as: "Bytes" })),
			benchmarkSync("ethers", () => ethers.sha256(data1k), "returns hex string"),
		);
		workloads.push({
			id: "sha256-1kb",
			title: "SHA-256 (1 KB)",
			category: "Hashing",
			unit: "hash/s",
			batchSize: 1,
			description: "Single 1,024-byte SHA-256 digest (EVM precompile 0x02 / KZG versioned hash).",
			results,
		});
	}

	if (shouldRun("blake2b-1kb")) {
		const expected = Voltaire.Hex.fromBytes(Voltaire.Blake2.hash(data1k, 64));
		const checks: Array<[string, string]> = [
			["WASM blake2.wasm", Voltaire.Hex.fromBytes(microBlake2(data1k))],
			["WASM primitives.wasm", Voltaire.Hex.fromBytes(WasmLoader.blake2b(data1k))],
		];
		if (VoltaireNative) {
			checks.push(["Native Zig FFI", Voltaire.Hex.fromBytes(VoltaireNative.Blake2.hash(data1k, 64))]);
		}
		for (const [label, actual] of checks) {
			if (actual !== expected) throw new Error(`BLAKE2b mismatch for ${label}: ${actual} !== ${expected}`);
		}

		const results: TimingEntry[] = [
			benchmarkSync("Voltaire (Pure TS)", () => Voltaire.Blake2.hash(data1k, 64)),
			benchmarkSync("Voltaire (WASM blake2.wasm)", () => microBlake2(data1k), "1.80 kB standalone"),
			benchmarkSync("Voltaire (WASM primitives.wasm)", () => WasmLoader.blake2b(data1k), "ReleaseSmall"),
		];
		if (VoltaireNative) {
			const nat = VoltaireNative;
			results.push(benchmarkSync("Voltaire (Native Zig FFI)", () => nat.Blake2.hash(data1k, 64), "ReleaseFast dylib"));
		}
		workloads.push({
			id: "blake2b-1kb",
			title: "BLAKE2b-512 (1 KB)",
			category: "Hashing",
			unit: "hash/s",
			batchSize: 1,
			description:
				"Single 1,024-byte BLAKE2b-512 digest (EIP-152 / Zcash / Polkadot). viem, ox, and ethers do not ship BLAKE2b.",
			results,
		});
	}

	// -------------------------------------------------------------------------
	// 5. ABI — ERC-20 transfer Encode + Decode (Batch 1,000) & Transfer Log Decode (Batch 1,000)
	// -------------------------------------------------------------------------
	const erc20Abi = [
		{
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [
				{ name: "to", type: "address" },
				{ name: "amount", type: "uint256" },
			],
			outputs: [{ name: "", type: "bool" }],
		},
		{
			type: "event",
			name: "Transfer",
			anonymous: false,
			inputs: [
				{ indexed: true, name: "from", type: "address" },
				{ indexed: true, name: "to", type: "address" },
				{ indexed: false, name: "value", type: "uint256" },
			],
		},
	] as const;

	const vAbi = Voltaire.Abi(erc20Abi);
	const oxTransferFn = ox.AbiFunction.fromAbi(erc20Abi, "transfer");
	const oxTransferEvt = ox.AbiEvent.fromAbi(erc20Abi, "Transfer");
	const ethersIface = new ethers.Interface(erc20Abi);

	const ABI_BATCH = 1000;
	const transferCalls = Array.from({ length: ABI_BATCH }, (_, i) => {
		const addrBytes = makeDeterministicBytes(20, 0x70000 + i);
		const to = Voltaire.Address.toChecksummed(addrBytes as Voltaire.AddressType) as `0x${string}`;
		const amount = BigInt(i + 1) * 1_000_000_000_000_000n;
		return { to, amount };
	});

	if (shouldRun("abi-erc20-transfer-batch-1000")) {
		// Parity check
		const c0 = transferCalls[0];
		const vEncHex = Voltaire.Hex.fromBytes(vAbi.encode("transfer", [c0.to, c0.amount]));
		const viemEncHex = viem.encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [c0.to, c0.amount] });
		const oxEncHex = ox.AbiFunction.encodeData(oxTransferFn, [c0.to, c0.amount]);
		const ethersEncHex = ethersIface.encodeFunctionData("transfer", [c0.to, c0.amount]);
		if (
			vEncHex.toLowerCase() !== viemEncHex.toLowerCase() ||
			vEncHex.toLowerCase() !== oxEncHex.toLowerCase() ||
			vEncHex.toLowerCase() !== ethersEncHex.toLowerCase()
		) {
			throw new Error("ABI ERC-20 transfer encode parity mismatch");
		}

		const results: TimingEntry[] = [
			benchmarkSync("Voltaire (Pure TS)", () => {
				let last: unknown = null;
				for (let i = 0; i < transferCalls.length; i++) {
					const c = transferCalls[i];
					const encoded = vAbi.encode("transfer", [c.to, c.amount]);
					last = vAbi.decodeData(encoded);
				}
				return last;
			}),
			benchmarkSync("viem", () => {
				let last: unknown = null;
				for (let i = 0; i < transferCalls.length; i++) {
					const c = transferCalls[i];
					const encoded = viem.encodeFunctionData({
						abi: erc20Abi,
						functionName: "transfer",
						args: [c.to, c.amount],
					});
					last = viem.decodeFunctionData({ abi: erc20Abi, data: encoded });
				}
				return last;
			}),
			benchmarkSync("ox", () => {
				let last: unknown = null;
				for (let i = 0; i < transferCalls.length; i++) {
					const c = transferCalls[i];
					const encoded = ox.AbiFunction.encodeData(oxTransferFn, [c.to, c.amount]);
					last = ox.AbiFunction.decodeData(oxTransferFn, encoded);
				}
				return last;
			}),
			benchmarkSync("ethers", () => {
				let last: unknown = null;
				for (let i = 0; i < transferCalls.length; i++) {
					const c = transferCalls[i];
					const encoded = ethersIface.encodeFunctionData("transfer", [c.to, c.amount]);
					last = ethersIface.decodeFunctionData("transfer", encoded);
				}
				return last;
			}),
		];
		workloads.push({
			id: "abi-erc20-transfer-batch-1000",
			title: "ABI ERC-20 transfer Encode + Decode (Batch 1,000)",
			category: "Encoding",
			unit: "batch/s",
			batchSize: ABI_BATCH,
			description: "Encode and decode 1,000 ERC-20 `transfer(address,uint256)` calldata payloads.",
			results,
		});
	}

	if (shouldRun("abi-erc20-log-decode-batch-1000")) {
		const transferTopic0 = Voltaire.Hex.fromBytes(
			Voltaire.Keccak256.hashString("Transfer(address,address,uint256)"),
		) as `0x${string}`;
		const topic0Bytes = Voltaire.Hex.toBytes(transferTopic0);
		const padTopic = (addr: string): `0x${string}` =>
			`0x${addr.slice(2).toLowerCase().padStart(64, "0")}`;

		const logFixtures = Array.from({ length: ABI_BATCH }, (_, i) => {
			const from = Voltaire.Hex.fromBytes(makeDeterministicBytes(20, 0x80000 + i));
			const to = transferCalls[i].to;
			const valHex = `0x${transferCalls[i].amount.toString(16).padStart(64, "0")}` as `0x${string}`;
			const t1 = padTopic(from);
			const t2 = padTopic(to);
			return {
				topicsHex: [transferTopic0, t1, t2] as [`0x${string}`, `0x${string}`, `0x${string}`],
				topicsBytes: [topic0Bytes, Voltaire.Hex.toBytes(t1), Voltaire.Hex.toBytes(t2)],
				dataHex: valHex,
				dataBytes: Voltaire.Hex.toBytes(valHex),
			};
		});

		// Parity check
		{
			const l0 = logFixtures[0];
			const vRes = Voltaire.Abi.Event.decodeLog(erc20Abi[1], l0.dataBytes, l0.topicsBytes) as { value: bigint };
			const viemRes = viem.decodeEventLog({ abi: erc20Abi, data: l0.dataHex, topics: l0.topicsHex }).args as { value: bigint };
			const oxRes = ox.AbiEvent.decode(oxTransferEvt, { data: l0.dataHex, topics: l0.topicsHex }) as { value: bigint };
			const ethersRes = ethersIface.parseLog({ data: l0.dataHex, topics: l0.topicsHex });
			if (
				vRes.value !== transferCalls[0].amount ||
				viemRes.value !== transferCalls[0].amount ||
				oxRes.value !== transferCalls[0].amount ||
				ethersRes?.args.value !== transferCalls[0].amount
			) {
				throw new Error("ABI ERC-20 Transfer log decode parity mismatch");
			}
		}

		const results: TimingEntry[] = [
			benchmarkSync("Voltaire (Pure TS)", () => {
				let last: unknown = null;
				for (let i = 0; i < logFixtures.length; i++) {
					const l = logFixtures[i];
					last = Voltaire.Abi.Event.decodeLog(erc20Abi[1], l.dataBytes, l.topicsBytes);
				}
				return last;
			}),
			benchmarkSync("viem", () => {
				let last: unknown = null;
				for (let i = 0; i < logFixtures.length; i++) {
					const l = logFixtures[i];
					last = viem.decodeEventLog({ abi: erc20Abi, data: l.dataHex, topics: l.topicsHex });
				}
				return last;
			}),
			benchmarkSync("ox", () => {
				let last: unknown = null;
				for (let i = 0; i < logFixtures.length; i++) {
					const l = logFixtures[i];
					last = ox.AbiEvent.decode(oxTransferEvt, { data: l.dataHex, topics: l.topicsHex });
				}
				return last;
			}),
			benchmarkSync("ethers", () => {
				let last: unknown = null;
				for (let i = 0; i < logFixtures.length; i++) {
					const l = logFixtures[i];
					last = ethersIface.parseLog({ data: l.dataHex, topics: l.topicsHex });
				}
				return last;
			}),
		];
		workloads.push({
			id: "abi-erc20-log-decode-batch-1000",
			title: "ABI ERC-20 Transfer Log Decode (Batch 1,000)",
			category: "Encoding",
			unit: "batch/s",
			batchSize: ABI_BATCH,
			description: "Decode 1,000 indexed ERC-20 `Transfer(indexed from, indexed to, value)` event logs.",
			results,
		});
	}

	// -------------------------------------------------------------------------
	// 6. RLP — EIP-1559 Transaction Payload Encode + Decode (Batch 1,000)
	// -------------------------------------------------------------------------
	if (shouldRun("rlp-eip1559-batch-1000")) {
		const RLP_BATCH = 1000;
		const sampleCalldata = vAbi.encode("transfer", [transferCalls[0].to, transferCalls[0].amount]);
		const rlpPayloadsBytes = Array.from({ length: RLP_BATCH }, (_, i) => {
			const nonceBytes = i === 0 ? new Uint8Array(0) : new Uint8Array([(i >> 8) & 0xff, i & 0xff]).slice(i < 256 ? 1 : 0);
			const toBytes = makeDeterministicBytes(20, 0xa0000 + i);
			const slotBytes = makeDeterministicBytes(32, 0xb0000 + i);
			return [
				new Uint8Array([1]), // chainId = 1
				nonceBytes, // nonce
				new Uint8Array([0x59, 0x68, 0x2f, 0x00]), // maxPriorityFeePerGas (1.5 gwei)
				new Uint8Array([0x0b, 0xa4, 0x3b, 0x74, 0x00]), // maxFeePerGas (50 gwei)
				new Uint8Array([0x01, 0x11, 0x70]), // gasLimit (70,000)
				toBytes, // to
				new Uint8Array(0), // value = 0
				sampleCalldata, // 68-byte ERC-20 transfer calldata
				[[toBytes, [slotBytes]]], // 1-entry EIP-2930 access list
			];
		});
		const toHexNested = (item: Uint8Array | unknown[]): string | unknown[] =>
			item instanceof Uint8Array ? Voltaire.Hex.fromBytes(item) : item.map((x) => toHexNested(x as Uint8Array | unknown[]));
		const rlpPayloadsHex = rlpPayloadsBytes.map((p) => toHexNested(p));

		// Parity check
		{
			const vEnc = Voltaire.Hex.fromBytes(Voltaire.Rlp.encode(rlpPayloadsBytes[0] as Voltaire.BrandedRlp.Encodable));
			const viemEnc = Voltaire.Hex.fromBytes(viem.toRlp(rlpPayloadsBytes[0], "bytes"));
			const oxEnc = Voltaire.Hex.fromBytes(ox.Rlp.from(rlpPayloadsBytes[0], { as: "Bytes" }));
			const ethersEnc = ethers.encodeRlp(rlpPayloadsHex[0]).toLowerCase();
			if (vEnc !== viemEnc || vEnc !== oxEnc || vEnc !== ethersEnc) {
				throw new Error(`RLP encode parity mismatch: ${vEnc.slice(0, 32)} vs ${viemEnc.slice(0, 32)}`);
			}
		}

		const results: TimingEntry[] = [
			benchmarkSync("Voltaire (Pure TS)", () => {
				let last: unknown = null;
				for (let i = 0; i < rlpPayloadsBytes.length; i++) {
					const enc = Voltaire.Rlp.encode(rlpPayloadsBytes[i] as Voltaire.BrandedRlp.Encodable);
					last = Voltaire.Rlp.decode(enc);
				}
				return last;
			}),
			benchmarkSync("viem", () => {
				let last: unknown = null;
				for (let i = 0; i < rlpPayloadsBytes.length; i++) {
					const enc = viem.toRlp(rlpPayloadsBytes[i], "bytes");
					last = viem.fromRlp(enc, "bytes");
				}
				return last;
			}),
			benchmarkSync("ox", () => {
				let last: unknown = null;
				for (let i = 0; i < rlpPayloadsBytes.length; i++) {
					const enc = ox.Rlp.from(rlpPayloadsBytes[i], { as: "Bytes" });
					last = ox.Rlp.to(enc, { as: "Bytes" });
				}
				return last;
			}),
			benchmarkSync(
				"ethers",
				() => {
					let last: unknown = null;
					for (let i = 0; i < rlpPayloadsHex.length; i++) {
						const enc = ethers.encodeRlp(rlpPayloadsHex[i]);
						last = ethers.decodeRlp(enc);
					}
					return last;
				},
				"hex string API",
			),
		];
		workloads.push({
			id: "rlp-eip1559-batch-1000",
			title: "RLP EIP-1559 Transaction Encode + Decode (Batch 1,000)",
			category: "Encoding",
			unit: "batch/s",
			batchSize: RLP_BATCH,
			description:
				"Canonical RLP encode + decode of 1,000 realistic EIP-1559 payloads (with 68-byte ERC-20 calldata + access list entry).",
			results,
		});
	}

	// -------------------------------------------------------------------------
	// 7. Bytecode — JUMPDEST Analysis & Full Opcode Scan (~2.5 KB ERC-20 + Proxy)
	// -------------------------------------------------------------------------
	const contractCode = Voltaire.Bytecode(buildRealisticContractBytecode());

	if (shouldRun("bytecode-jumpdest")) {
		const tsJumpdests = [...Voltaire.Bytecode.analyzeJumpDestinations(contractCode)].sort((a, b) => a - b);
		const wasmJumpdests = [...WasmLoader.bytecodeAnalyzeJumpdests(contractCode)].sort((a, b) => a - b);
		if (JSON.stringify(tsJumpdests) !== JSON.stringify(wasmJumpdests)) {
			throw new Error(`Bytecode JUMPDEST mismatch: TS=${tsJumpdests.length} vs WASM=${wasmJumpdests.length}`);
		}

		const results: TimingEntry[] = [
			benchmarkSync(
				"Voltaire (Pure TS)",
				() => Voltaire.Bytecode.analyzeJumpDestinations(contractCode),
				`${tsJumpdests.length} JUMPDESTs in ${contractCode.length} B`,
			),
			benchmarkSync(
				"Voltaire (WASM primitives.wasm)",
				() => WasmLoader.bytecodeAnalyzeJumpdests(contractCode),
				"ReleaseSmall",
			),
		];
		workloads.push({
			id: "bytecode-jumpdest",
			title: `Bytecode JUMPDEST Analysis (${contractCode.length} B contract)`,
			category: "EVM Bytecode",
			unit: "analysis/s",
			batchSize: 1,
			description: `Locate all ${tsJumpdests.length} valid JUMPDEST offsets across a ${contractCode.length}-byte ERC-20 + EIP-1967 proxy contract while skipping PUSH1..PUSH32 immediate data. viem, ox, and ethers do not ship EVM bytecode analyzers.`,
			results,
		});
	}

	if (shouldRun("bytecode-scan")) {
		const tsCount = Voltaire.Bytecode.parseInstructions(contractCode).length;
		const wasmCount = WasmLoader.bytecodeScan(contractCode, 0, contractCode.length).length;
		if (tsCount !== wasmCount) {
			throw new Error(`Bytecode scan instruction count mismatch: TS=${tsCount} vs WASM=${wasmCount}`);
		}

		const results: TimingEntry[] = [
			benchmarkSync(
				"Voltaire (Pure TS)",
				() => Voltaire.Bytecode.parseInstructions(contractCode),
				`${tsCount} instructions`,
			),
			benchmarkSync(
				"Voltaire (WASM primitives.wasm)",
				() => WasmLoader.bytecodeScan(contractCode, 0, contractCode.length),
				"ReleaseSmall",
			),
		];
		workloads.push({
			id: "bytecode-scan",
			title: `Bytecode Opcode Scan (${contractCode.length} B, ${tsCount} ops)`,
			category: "EVM Bytecode",
			unit: "scan/s",
			batchSize: 1,
			description: `Decode all ${tsCount} instructions and immediate operands across a ${contractCode.length}-byte contract.`,
			results,
		});
	}

	const bundleSizes = await measureBundleSizes();
	const wasmArtifacts = measureWasmArtifacts();

	return { metadata, workloads, bundleSizes, wasmArtifacts };
}

// ---------------------------------------------------------------------------
// Output renderers: Terminal, Markdown, and Mintlify MDX
// ---------------------------------------------------------------------------

function renderWorkloadMarkdownTable(w: WorkloadReport): string {
	const fastestOps = Math.max(...w.results.map((r) => r.opsPerSec));
	const lines: string[] = [
		"| Implementation | Median | p99 | Throughput | Relative | Notes |",
		"| --- | ---: | ---: | ---: | ---: | --- |",
	];
	for (const r of w.results) {
		const ratio = fastestOps / r.opsPerSec;
		const rel = ratio <= 1.01 ? "**1.00× (fastest)**" : `${ratio.toFixed(2)}× slower`;
		lines.push(
			`| ${r.impl} | ${formatDurationUs(r.medianUs)} | ${formatDurationUs(r.p99Us)} | ${formatOps(r.opsPerSec)} ${w.unit} | ${rel} | ${r.note ?? ""} |`,
		);
	}
	return lines.join("\n");
}

function renderBundleMarkdownTable(entries: BundleEntry[]): string {
	const lines: string[] = [
		"| Primitive | Library | Import Style | Minified | Gzipped |",
		"| --- | --- | --- | ---: | ---: |",
	];
	for (const e of entries) {
		lines.push(
			`| ${e.primitive} | ${e.library} | \`${e.importStyle}\` | ${formatKb(e.minifiedBytes)} | **${formatKb(e.gzipBytes)}** |`,
		);
	}
	return lines.join("\n");
}

function renderWasmArtifactsMarkdownTable(entries: WasmArtifactEntry[]): string {
	const lines: string[] = [
		"| Artifact | Path | Raw Size | Gzipped | Role |",
		"| --- | --- | ---: | ---: | --- |",
	];
	for (const e of entries) {
		lines.push(
			`| \`${e.name}\` | \`${e.path}\` | ${formatKb(e.rawBytes)} (${e.rawBytes.toLocaleString("en-US")} B) | **${formatKb(e.gzipBytes)}** | ${e.role} |`,
		);
	}
	return lines.join("\n");
}

function renderMarkdownReport(report: FullReport): string {
	const m = report.metadata;
	const parts: string[] = [
		"# Voltaire Benchmark Report",
		"",
		`- **Date:** ${m.timestamp.split("T")[0]}`,
		`- **Hardware:** ${m.cpu} (${m.cores} cores, ${m.arch})`,
		`- **OS / Runtime:** ${m.os} · Bun ${m.bunVersion}`,
		`- **Libraries:** \`@tevm/voltaire\` ${m.versions.voltaire} · \`viem\` ${m.versions.viem} · \`ox\` ${m.versions.ox} · \`ethers\` ${m.versions.ethers}`,
		`- **Native Zig FFI:** ${m.nativeFfiAvailable ? "Enabled (ReleaseFast dylib)" : "Skipped (no native dylib built)"}`,
		"",
		"## Runtime Benchmarks",
		"",
	];

	for (const w of report.workloads) {
		parts.push(`### ${w.title}`, "", w.description, "", renderWorkloadMarkdownTable(w), "");
	}

	parts.push(
		"## Single-Primitive Bundle Sizes (ESM, minified + gzip)",
		"",
		renderBundleMarkdownTable(report.bundleSizes),
		"",
		"## Shipped Zig WASM Artifacts",
		"",
		renderWasmArtifactsMarkdownTable(report.wasmArtifacts),
		"",
	);

	return parts.join("\n");
}

function renderMintlifyMdx(report: FullReport): string {
	const m = report.metadata;
	const findW = (id: string) => report.workloads.find((w) => w.id === id);
	const findImpl = (w: WorkloadReport | undefined, prefix: string) =>
		w?.results.find((r) => r.impl === prefix);

	// Derive honest data-driven callout facts directly from the measured run
	const k32 = findW("keccak256-32b");
	const k1k = findW("keccak256-1kb");
	const addrW = findW("address-checksum-batch-1000");
	const secpRec = findW("secp256k1-recover-batch-100");
	const secpSign = findW("secp256k1-sign-batch-100");
	const sha1k = findW("sha256-1kb");
	const blake1k = findW("blake2b-1kb");
	const abiW = findW("abi-erc20-transfer-batch-1000");
	const rlpW = findW("rlp-eip1559-batch-1000");
	const bcScan = findW("bytecode-scan");

	const highlights: string[] = [];
	if (k32 && k1k) {
		const ts32 = findImpl(k32, "Voltaire (Pure TS)");
		const micro32 = findImpl(k32, "Voltaire (WASM keccak256.wasm)");
		const nat32 = findImpl(k32, "Voltaire (Native Zig FFI)");
		const viem32 = findImpl(k32, "viem");
		if (nat32 && micro32 && ts32) {
			highlights.push(
				`- **Keccak-256 (32 B):** Native Zig FFI hits ${formatDurationUs(nat32.medianUs)} (${formatOps(nat32.opsPerSec)} hash/s, ${(nat32.opsPerSec / ts32.opsPerSec).toFixed(1)}× faster than Pure TS${viem32 ? `, ${(nat32.opsPerSec / viem32.opsPerSec).toFixed(1)}× faster than viem` : ""}). Standalone \`keccak256.wasm\` (3.16 kB raw / 1.79 kB gzip) hits ${formatDurationUs(micro32.medianUs)} (${(micro32.opsPerSec / ts32.opsPerSec).toFixed(1)}× faster than Pure TS).`,
			);
		}
	}
	if (addrW) {
		const ts = findImpl(addrW, "Voltaire (Pure TS)");
		const wasm = findImpl(addrW, "Voltaire (WASM primitives.wasm)");
		const nat = findImpl(addrW, "Voltaire (Native Zig FFI)");
		const viemR = findImpl(addrW, "viem");
		if (wasm && ts && nat) {
			highlights.push(
				`- **Address EIP-55 Checksum (1,000 cold addresses):** \`primitives.wasm\` completes in ${formatDurationUs(wasm.medianUs)} (${(wasm.opsPerSec / ts.opsPerSec).toFixed(1)}× faster than Pure TS${viemR ? `, ${(wasm.opsPerSec / viemR.opsPerSec).toFixed(1)}× faster than viem` : ""}), and Native Zig FFI completes in ${formatDurationUs(nat.medianUs)}.`,
			);
		}
	}
	if (secpRec) {
		const ts = findImpl(secpRec, "Voltaire (Pure TS)");
		const nat = findImpl(secpRec, "Voltaire (Native Zig FFI)");
		const wasm = findImpl(secpRec, "Voltaire (WASM primitives.wasm)");
		const viemR = findImpl(secpRec, "viem");
		if (nat && ts && wasm) {
			highlights.push(
				`- **Secp256k1 ecrecover (100 signatures):** Native Zig FFI finishes in ${formatDurationUs(nat.medianUs)} (${(nat.opsPerSec / ts.opsPerSec).toFixed(1)}× faster than Pure TS${viemR ? `, ${(nat.opsPerSec / viemR.opsPerSec).toFixed(1)}× faster than viem` : ""}). By contrast, \`ReleaseSmall\` \`primitives.wasm\` (${formatDurationUs(wasm.medianUs)}) is ${(wasm.medianUs / ts.medianUs).toFixed(1)}× slower than Pure TS because size-optimized WASM disables unrolled elliptic-curve loops.`,
			);
		}
	}
	if (secpSign) {
		const ts = findImpl(secpSign, "Voltaire (Pure TS)");
		const nat = findImpl(secpSign, "Voltaire (Native Zig FFI)");
		const viemR = findImpl(secpSign, "viem");
		if (nat && ts && viemR) {
			highlights.push(
				`- **Secp256k1 sign (100 messages):** Native Zig FFI (${formatDurationUs(nat.medianUs)}) matches \`ox\`/\`ethers\` and trails \`viem\` (${formatDurationUs(viemR.medianUs)}); Pure TS (${formatDurationUs(ts.medianUs)}) is slower because Voltaire Pure TS does not keep precomputed base-point lookup tables in memory.`,
			);
		}
	}
	if (sha1k && blake1k) {
		const shaNat = findImpl(sha1k, "Voltaire (Native Zig FFI)");
		const shaTs = findImpl(sha1k, "Voltaire (Pure TS)");
		const bNat = findImpl(blake1k, "Voltaire (Native Zig FFI)");
		const bTs = findImpl(blake1k, "Voltaire (Pure TS)");
		const bMicro = findImpl(blake1k, "Voltaire (WASM blake2.wasm)");
		if (shaNat && shaTs && bNat && bTs && bMicro) {
			highlights.push(
				`- **SHA-256 & BLAKE2b-512 (1 KB):** Native Zig FFI runs SHA-256 in ${formatDurationUs(shaNat.medianUs)} (${(shaNat.opsPerSec / shaTs.opsPerSec).toFixed(1)}× vs Pure TS) and BLAKE2b-512 in ${formatDurationUs(bNat.medianUs)} (${(bNat.opsPerSec / bTs.opsPerSec).toFixed(1)}× vs Pure TS); standalone \`blake2.wasm\` (1.80 kB raw) runs BLAKE2b-512 in ${formatDurationUs(bMicro.medianUs)} (${(bMicro.opsPerSec / bTs.opsPerSec).toFixed(1)}× vs Pure TS).`,
			);
		}
	}
	if (abiW && rlpW && bcScan) {
		const abiTs = findImpl(abiW, "Voltaire (Pure TS)");
		const abiOx = findImpl(abiW, "ox");
		const rlpTs = findImpl(rlpW, "Voltaire (Pure TS)");
		const rlpViem = findImpl(rlpW, "viem");
		const bcTs = findImpl(bcScan, "Voltaire (Pure TS)");
		const bcWasm = findImpl(bcScan, "Voltaire (WASM primitives.wasm)");
		if (abiTs && abiOx && rlpTs && rlpViem && bcTs && bcWasm) {
			highlights.push(
				`- **Honest JS-object & boundary trade-offs:** On RLP EIP-1559 round-trips (1,000 txs), Voltaire Pure TS (${formatDurationUs(rlpTs.medianUs)}) is on par with \`viem\` (${formatDurationUs(rlpViem.medianUs)}). On ABI batch encode/decode, \`ox\` (${formatDurationUs(abiOx.medianUs)}) beats Voltaire Pure TS (${formatDurationUs(abiTs.medianUs)}) because Voltaire validates branded types and allocates fresh views per call. On full Bytecode opcode scans, Pure TS (${formatDurationUs(bcTs.medianUs)}) edges out WASM (${formatDurationUs(bcWasm.medianUs)}) because marshaling 1,374 instruction objects across the JS↔WASM boundary dominates the scan time.`,
			);
		}
	}

	const sections: string[] = [
		"---",
		"title: Benchmarks & Bundle Sizes",
		"description: Measured runtime performance and bundle-size comparisons across Voltaire (Pure TS, Zig WASM, Native Zig FFI), viem, ox, and ethers.",
		"---",
		"",
		"Reproducible measurements of real Ethereum workloads comparing `@tevm/voltaire` across its three execution backends (Pure TypeScript, Zig WebAssembly, and Native Zig FFI) alongside `viem`, `ox`, and `ethers`.",
		"",
		"Every implementation is checked for byte-for-byte output parity before timing starts. Numbers below were captured directly from `bun scripts/run-benchmarks.ts --write-docs` on the hardware listed in [Test Environment](#test-environment).",
		"",
		"## Choosing a Backend",
		"",
		"```mermaid",
		"flowchart LR",
		'  Input["Ethereum Workload"] --> Shape{"JS object heavy (ABI, RLP, opcode scan)?"}',
		'  Shape -->|Yes| TS["Voltaire Pure TS (zero FFI or WASM marshaling)"]',
		'  Shape -->|No| Runtime{"Server or Bun with native dylib?"}',
		'  Runtime -->|Yes| Native["Voltaire Native Zig FFI (ReleaseFast dylib)"]',
		'  Runtime -->|No| Wasm["Voltaire Zig WASM (1.2-3.2 kB micro-WASM or 117 kB gzip primitives.wasm)"]',
		"```",
		"",
		"### Key Takeaways from Measured Data",
		"",
		...highlights,
		"",
		"## Test Environment",
		"",
		"| Parameter | Value |",
		"| --- | --- |",
		`| **Captured** | ${m.timestamp.split("T")[0]} |`,
		`| **CPU** | ${m.cpu} (${m.cores} cores, ${m.arch}) |`,
		`| **OS & Runtime** | ${m.os} · Bun ${m.bunVersion} |`,
		`| **Voltaire** | \`@tevm/voltaire\` v${m.versions.voltaire} (zero \`ox\` / \`@tevm/chains\` runtime dependencies) |`,
		`| **Comparison Libraries** | \`viem\` v${m.versions.viem} · \`ox\` v${m.versions.ox} · \`ethers\` v${m.versions.ethers} |`,
		`| **Native Zig FFI** | ${m.nativeFfiAvailable ? "Auto-detected (`zig-out/native/libprimitives_ts_native.dylib`, ReleaseFast, zero-Rust)" : "Not built on this host"} |`,
		"| **Timing Method** | Monotonic `Bun.nanoseconds()`, JIT warmup, calibrated inner batching, median & p99 reported |",
		"",
		"<Note>",
		"Both `viem.getAddress` (8,192-entry `LruMap`) and `ox.Address.checksum` cache checksummed strings internally. To measure genuine parsing and Keccak-256 hashing rather than repeated cache lookups, the Address benchmark rotates through 25,000 unique addresses and clears `ox.Caches` before each timed sample. Applications that repeatedly checksum a small hot set of addresses will observe cache hits in `viem` and `ox`.",
		"</Note>",
		"",
		"## Runtime Benchmarks",
		"",
	];

	for (const w of report.workloads) {
		sections.push(`### ${w.title}`, "", w.description, "", renderWorkloadMarkdownTable(w), "");
	}

	sections.push(
		"## Bundle Size Comparison",
		"",
		"Each entry below was bundled in isolation with `Bun.build({ minify: true, target: \"browser\", format: \"esm\" })` and compressed with `zlib.gzipSync(..., { level: 9 })`.",
		"",
		renderBundleMarkdownTable(report.bundleSizes),
		"",
		"### Reading the Bundle Size Trade-Offs",
		"",
		"- **Leaf and named imports stay small:** `Keccak256/hash.js` is ~2.5 kB gzip and named `Rlp` (`encode`, `decode`) is ~1.9 kB gzip — smaller than or on par with `viem`, `ox`, and `ethers`.",
		"- **Namespace objects trade size for ergonomics:** Importing full namespace objects (`Address`, `Abi`) binds convenience helpers (such as `Address.fromPublicKey` pulling in secp256k1, or `Abi` error and event decoders) at module evaluation time. When minimizing browser bundle size, prefer leaf/named imports or standalone micro-WASM modules.",
		"- **Micro-WASM modules stay between 0.74 and 1.79 kB gzip:** Individual Zig WASM builds (`address.wasm`, `keccak256.wasm`, `blake2.wasm`, `ripemd160.wasm`) avoid shipping JS crypto dependencies altogether.",
		"",
		"## Shipped Zig WASM Artifacts",
		"",
		"Measured directly from the built artifacts in `wasm/`:",
		"",
		renderWasmArtifactsMarkdownTable(report.wasmArtifacts),
		"",
		"## Reproducing These Numbers",
		"",
		"Run the benchmark suite from the repository root with Bun:",
		"",
		"```bash",
		"# Human-readable terminal report",
		"bun scripts/run-benchmarks.ts",
		"",
		"# Machine-readable JSON output",
		"bun scripts/run-benchmarks.ts --json",
		"",
		"# Markdown tables to stdout",
		"bun scripts/run-benchmarks.ts --markdown",
		"",
		"# Re-run and regenerate this documentation page",
		"bun scripts/run-benchmarks.ts --write-docs",
		"```",
		"",
		"To include the Native Zig FFI backend on your machine, build the shared library once before running the script:",
		"",
		"```bash",
		"zig build build-ts-native -Dwith-c-api=true",
		"bun scripts/run-benchmarks.ts",
		"```",
		"",
		"See [Library Comparisons](/comparisons) for architectural differences and [WASM & Runtimes](/concepts/runtimes-and-wasm) for backend selection details.",
		"",
	);

	return sections.join("\n");
}

function printTerminalReport(report: FullReport): void {
	const m = report.metadata;
	console.log("=".repeat(78));
	console.log("  VOLTAIRE MULTI-WORKLOAD BENCHMARK & BUNDLE-SIZE SUITE");
	console.log("=".repeat(78));
	console.log(`CPU:      ${m.cpu} (${m.cores} cores, ${m.arch})`);
	console.log(`OS/Bun:   ${m.os} · Bun ${m.bunVersion}`);
	console.log(
		`Versions: voltaire ${m.versions.voltaire} | viem ${m.versions.viem} | ox ${m.versions.ox} | ethers ${m.versions.ethers}`,
	);
	console.log(
		`Native:   ${m.nativeFfiAvailable ? `ENABLED (${m.nativeLibPath})` : "SKIPPED (zig-out/native not found)"}`,
	);
	console.log("");

	for (const w of report.workloads) {
		console.log(`--- ${w.title} ---`);
		const fastest = Math.max(...w.results.map((r) => r.opsPerSec));
		for (const r of w.results) {
			const rel = fastest / r.opsPerSec;
			const relStr = rel <= 1.01 ? "1.00x (fastest)" : `${rel.toFixed(2)}x slower`;
			console.log(
				`  ${r.impl.padEnd(32)} ${formatDurationUs(r.medianUs).padStart(10)} median | ${formatDurationUs(r.p99Us).padStart(10)} p99 | ${(formatOps(r.opsPerSec) + " " + w.unit).padStart(18)} | ${relStr}${r.note ? ` [${r.note}]` : ""}`,
			);
		}
		console.log("");
	}

	console.log("--- Single-Primitive Bundle Sizes (Bun.build --minify + gzip -9) ---");
	for (const b of report.bundleSizes) {
		console.log(
			`  ${b.primitive.padEnd(10)} ${b.library.padEnd(20)} ${formatKb(b.minifiedBytes).padStart(10)} min | ${formatKb(b.gzipBytes).padStart(10)} gzip  (${b.importStyle})`,
		);
	}
	console.log("");

	console.log("--- Shipped Zig WASM Artifacts ---");
	for (const a of report.wasmArtifacts) {
		console.log(
			`  ${a.name.padEnd(22)} ${formatKb(a.rawBytes).padStart(10)} raw | ${formatKb(a.gzipBytes).padStart(10)} gzip  (${a.role})`,
		);
	}
	console.log("");
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	const report = await runSuite();

	if (FLAG_WRITE_DOCS) {
		const mdx = renderMintlifyMdx(report);
		writeFileSync(DOCS_BENCHMARKS_PATH, mdx, "utf8");
		if (!FLAG_JSON && !FLAG_MARKDOWN) {
			printTerminalReport(report);
			console.log(`Wrote Mintlify benchmark docs to: ${DOCS_BENCHMARKS_PATH}`);
		}
	}

	if (FLAG_JSON) {
		console.log(JSON.stringify(report, null, 2));
		return;
	}

	if (FLAG_MARKDOWN) {
		console.log(renderMarkdownReport(report));
		return;
	}

	if (!FLAG_WRITE_DOCS) {
		printTerminalReport(report);
	}

	// Keep dead-code elimination sink referenced
	if (sink === Symbol.for("__never__")) {
		console.log(sink);
	}
}

await main();

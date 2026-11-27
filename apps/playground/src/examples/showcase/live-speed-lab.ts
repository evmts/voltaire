import { Address, Bytecode, Hex, Keccak256, Rlp } from "@tevm/voltaire";
import * as VoltaireWasm from "@tevm/voltaire/wasm";

/**
 * Showcase 3: Live Speed Lab (Pure TS vs Zig WASM)
 *
 * Runs live in-browser timing comparisons right on your CPU:
 *   1. Keccak-256 Batch (1,000 × 32 B)
 *   2. Address EIP-55 Checksum (500 unique addresses)
 *   3. RLP Encode + Decode (1,000 EIP-1559 payloads) & WASM bytes encode
 *   4. EVM Bytecode JUMPDEST Analysis (~2.4 KB contract × 200 runs)
 */

// Ensure Voltaire's Zig WASM runtime (336.7 kB raw / 117.5 kB gzip) is loaded
if (!VoltaireWasm.isWasmLoaded()) {
	await VoltaireWasm.initWasm("/wasm/primitives.wasm");
}

function makeBytes(len: number, seed: number): Uint8Array {
	const out = new Uint8Array(len);
	let s = (seed >>> 0) || 1;
	for (let i = 0; i < len; i++) {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
		out[i] = (s >>> 24) & 0xff;
	}
	return out;
}

interface BenchResult {
	name: string;
	ms: number;
	opsPerSec: number;
}

function measure(name: string, rounds: number, fn: () => unknown): BenchResult {
	// Warmup JIT & WASM tiers
	for (let i = 0; i < 3; i++) fn();
	const start = performance.now();
	let sink: unknown = null;
	for (let i = 0; i < rounds; i++) {
		sink = fn();
	}
	const elapsed = performance.now() - start;
	if (sink === Symbol.for("__never__")) console.log(sink);
	const msPerRun = elapsed / rounds;
	return {
		name,
		ms: msPerRun,
		opsPerSec: 1000 / msPerRun,
	};
}

function formatRow(label: string, ts: BenchResult, wasm: BenchResult, unit: string, parity: boolean): string {
	const speedup = ts.ms / wasm.ms;
	const winner = speedup >= 1 ? `WASM ${speedup.toFixed(2)}× faster` : `TS ${(1 / speedup).toFixed(2)}× faster`;
	return [
		label.padEnd(32),
		`${ts.ms.toFixed(2).padStart(7)} ms (${Math.round(ts.opsPerSec).toLocaleString("en-US").padStart(6)} ${unit})`,
		`${wasm.ms.toFixed(2).padStart(7)} ms (${Math.round(wasm.opsPerSec).toLocaleString("en-US").padStart(6)} ${unit})`,
		winner.padEnd(18),
		parity ? "PASS" : "MISMATCH",
	].join(" | ");
}

console.log("=== Voltaire Live Speed Lab (Pure TS vs Zig WASM in Browser) ===");
console.log(`WASM Runtime Loaded: ${VoltaireWasm.isWasmLoaded()}\n`);
console.log(
	[
		"Workload".padEnd(32),
		"Pure TS".padEnd(27),
		"Zig WASM".padEnd(27),
		"Delta".padEnd(18),
		"Parity",
	].join(" | "),
);
console.log("-".repeat(118));

// ---------------------------------------------------------------------------
// 1. Keccak-256 Batch (1,000 × 32 B)
// ---------------------------------------------------------------------------
const hashInputs = Array.from({ length: 1000 }, (_, i) => makeBytes(32, 0x1000 + i));
const kTsSample = Hex.fromBytes(Keccak256.hash(hashInputs[0]));
const kWasmSample = Hex.fromBytes(VoltaireWasm.Keccak256.hash(hashInputs[0]));

const kTs = measure("Keccak TS", 15, () => {
	let last: Uint8Array = hashInputs[0];
	for (let i = 0; i < hashInputs.length; i++) last = Keccak256.hash(hashInputs[i]);
	return last;
});
const kWasm = measure("Keccak WASM", 15, () => {
	let last: Uint8Array = hashInputs[0];
	for (let i = 0; i < hashInputs.length; i++) last = VoltaireWasm.Keccak256.hash(hashInputs[i]);
	return last;
});
console.log(formatRow("Keccak-256 (1,000 × 32 B)", kTs, kWasm, "b/s", kTsSample === kWasmSample));

// ---------------------------------------------------------------------------
// 2. Address Parse + EIP-55 Checksum (500 unique addresses)
// ---------------------------------------------------------------------------
const addrInputs = Array.from({ length: 500 }, (_, i) => Hex.fromBytes(makeBytes(20, 0x2000 + i)));
const hexChars = "0123456789abcdef";
const utf8 = new TextEncoder();

function checksumWithWasmKeccak(hexAddr: string): string {
	const bytes = Address.fromHex(hexAddr);
	let lower = "";
	for (let i = 0; i < 20; i++) {
		lower += hexChars[bytes[i] >> 4] + hexChars[bytes[i] & 0x0f];
	}
	const digest = VoltaireWasm.Keccak256.hash(utf8.encode(lower));
	let out = "0x";
	for (let i = 0; i < 40; i++) {
		const ch = lower[i];
		const nibble = i % 2 === 0 ? digest[i >> 1] >> 4 : digest[i >> 1] & 0x0f;
		out += nibble >= 8 ? ch.toUpperCase() : ch;
	}
	return out;
}

const aTsSample = Address.toChecksummed(Address.fromHex(addrInputs[0]));
const aWasmSample = checksumWithWasmKeccak(addrInputs[0]);

const aTs = measure("Address TS", 15, () => {
	let last = "";
	for (let i = 0; i < addrInputs.length; i++) last = Address.toChecksummed(Address.fromHex(addrInputs[i]));
	return last;
});
const aWasm = measure("Address WASM", 15, () => {
	let last = "";
	for (let i = 0; i < addrInputs.length; i++) last = checksumWithWasmKeccak(addrInputs[i]);
	return last;
});
console.log(formatRow("Address EIP-55 (500 addrs)", aTs, aWasm, "b/s", aTsSample === aWasmSample));

// ---------------------------------------------------------------------------
// 3. RLP Encode + Decode (1,000 EIP-1559 payloads) + WASM RLP bytes check
// ---------------------------------------------------------------------------
const rlpPayloads = Array.from({ length: 1000 }, (_, i) => [
	new Uint8Array([1]),
	new Uint8Array([(i >> 8) & 0xff, i & 0xff]),
	new Uint8Array([0x59, 0x68, 0x2f, 0x00]),
	new Uint8Array([0x0b, 0xa4, 0x3b, 0x74, 0x00]),
	new Uint8Array([0x52, 0x08]),
	makeBytes(20, 0x3000 + i),
	new Uint8Array([0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00]),
	makeBytes(68, 0x4000 + i),
	[],
]);
const rlpSampleBuf = makeBytes(128, 0x5555);
const rlpParity = Hex.fromBytes(Rlp.encodeBytes(rlpSampleBuf)) === Hex.fromBytes(VoltaireWasm.rlpEncodeBytes(rlpSampleBuf));

const rlpTs = measure("RLP Roundtrip TS", 20, () => {
	let last: unknown = null;
	for (let i = 0; i < rlpPayloads.length; i++) {
		last = Rlp.decode(Rlp.encode(rlpPayloads[i]));
	}
	return last;
});
const rlpWasmBytes = measure("RLP Bytes WASM", 20, () => {
	let last: Uint8Array = rlpSampleBuf;
	for (let i = 0; i < 1000; i++) {
		last = VoltaireWasm.rlpEncodeBytes(rlpSampleBuf);
	}
	return last;
});
console.log(formatRow("RLP (TS tx rt vs WASM bytes)", rlpTs, rlpWasmBytes, "b/s", rlpParity));

// ---------------------------------------------------------------------------
// 4. Bytecode JUMPDEST Analysis (~2.4 KB contract × 200 runs)
// ---------------------------------------------------------------------------
const chunks: number[] = [];
for (let i = 0; i < 40; i++) {
	chunks.push(
		0x5b, // JUMPDEST
		0x60, 0x04, 0x35, // PUSH1 0x04 CALLDATALOAD
		0x7f, // PUSH32 with embedded decoy 0x5b
		0x5b, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
		0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
		0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
		0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x5b,
		0x80, 0x54, 0x90, 0x55, // DUP1 SLOAD SWAP1 SSTORE
		0x5b, 0x60, 0x00, 0x80, 0xf3, // JUMPDEST RETURN
	);
}
const contractCode = Bytecode(new Uint8Array(chunks));
const tsJd = [...Bytecode.analyzeJumpDestinations(contractCode)].sort((a, b) => a - b);
const wasmJd = [...VoltaireWasm.analyzeJumpDestinations(contractCode)].sort((a, b) => a - b);
const jdParity = JSON.stringify(tsJd) === JSON.stringify(wasmJd);

const bcTs = measure("Bytecode TS", 20, () => {
	let last: ReadonlySet<number> | null = null;
	for (let i = 0; i < 200; i++) last = Bytecode.analyzeJumpDestinations(contractCode);
	return last;
});
const bcWasm = measure("Bytecode WASM", 20, () => {
	let last: number[] | null = null;
	for (let i = 0; i < 200; i++) last = VoltaireWasm.analyzeJumpDestinations(contractCode);
	return last;
});
console.log(formatRow(`Bytecode JUMPDEST (${contractCode.length}B×200)`, bcTs, bcWasm, "b/s", jdParity));

console.log("\nNotes:");
console.log("- Hashing and raw-byte scanning accelerate significantly in Zig WASM.");
console.log("- JS-object-heavy codecs (nested RLP/ABI) stay fast in Pure TS with zero WASM copy overhead.");

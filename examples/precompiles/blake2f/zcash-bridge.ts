import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import { Hardfork } from "../../../src/primitives/Hardfork/index.js";

// Blake2b IV constants
const BLAKE2B_IV = [
	0x6a09e667f3bcc908n,
	0xbb67ae8584caa73bn,
	0x3c6ef372fe94f82bn,
	0xa54ff53a5f1d36f1n,
	0x510e527fade682d1n,
	0x9b05688c2b3e6c1fn,
	0x1f83d9abfb41bd6bn,
	0x5be0cd19137e2179n,
];

// Zcash personalization string for Equihash
// "ZcashPoW" + n (200) + k (9) as bytes
const ZCASH_PERSONALIZATION = new Uint8Array([
	0x5a,
	0x63,
	0x61,
	0x73,
	0x68,
	0x50,
	0x6f,
	0x57, // "ZcashPoW"
	0xc8,
	0x00,
	0x00,
	0x00, // n = 200 (little-endian u32)
	0x09,
	0x00,
	0x00,
	0x00, // k = 9 (little-endian u32)
]);

/**
 * Initialize Blake2b state with Zcash personalization
 */
function initZcashState(): bigint[] {
	const state = [...BLAKE2B_IV];

	// XOR first word with parameter block
	// digest_length = 32 (Zcash uses Blake2b-256, not 512)
	state[0] ^= 0x01010020n;

	// XOR last two words with personalization string
	const view = new DataView(ZCASH_PERSONALIZATION.buffer);
	const p0 = view.getBigUint64(0, true);
	const p1 = view.getBigUint64(8, true);
	state[6] ^= p0;
	state[7] ^= p1;

	return state;
}

/**
 * Perform one Blake2f compression
 */
function compress(
	state: bigint[],
	message: Uint8Array,
	offset: bigint,
	isFinal: boolean,
): bigint[] {
	const input = new Uint8Array(213);
	const view = new DataView(input.buffer);

	// Rounds: 12 (standard)
	view.setUint32(0, 12, false);

	// State h
	state.forEach((s, i) => {
		view.setBigUint64(4 + i * 8, s, true);
	});

	// Message m: pad to 128 bytes
	const padded = new Uint8Array(128);
	padded.set(message.slice(0, Math.min(128, message.length)));
	input.set(padded, 68);

	// Offset counter t
	view.setBigUint64(196, offset, true);
	view.setBigUint64(204, 0n, true);

	// Final flag
	input[212] = isFinal ? 0x01 : 0x00;

	const result = execute(
		PrecompileAddress.BLAKE2F,
		input,
		20n,
		Hardfork.CANCUN,
	);

	if (!result.success) {
		throw new Error(`Blake2f failed: ${result.error}`);
	}

	// Extract new state
	const outView = new DataView(result.output.buffer);
	const newState: bigint[] = [];
	for (let i = 0; i < 8; i++) {
		newState.push(outView.getBigUint64(i * 8, true));
	}

	return newState;
}

/**
 * Hash a complete message using Blake2f
 */
function blake2bZcash(message: Uint8Array): Uint8Array {
	let state = initZcashState();
	let offset = 0n;

	// Process full 128-byte blocks
	const numBlocks = Math.floor(message.length / 128);
	for (let i = 0; i < numBlocks; i++) {
		const block = message.slice(i * 128, (i + 1) * 128);
		state = compress(state, block, offset + BigInt(block.length), false);
		offset += 128n;
	}

	// Process final block (may be partial)
	const remaining = message.slice(numBlocks * 128);
	state = compress(state, remaining, offset + BigInt(remaining.length), true);

	// Convert state to bytes (first 32 bytes for Blake2b-256)
	const hash = new Uint8Array(32);
	const view = new DataView(hash.buffer);
	for (let i = 0; i < 4; i++) {
		view.setBigUint64(i * 8, state[i], true);
	}

	return hash;
}

// Simulated Zcash block header (140 bytes)
const blockHeader = new Uint8Array(140);
blockHeader.set([
	0x04,
	0x00,
	0x00,
	0x00, // version = 4
	// ... (previous block hash, merkle root, etc.)
	// In real usage, this would be actual header data
]);

// Fill with example data
for (let i = 4; i < 140; i++) {
	blockHeader[i] = i % 256;
}

let totalGas = 0n;

// Hash the header
const headerHash = blake2bZcash(blockHeader);

// Calculate gas: 2 blocks (140 bytes = 1 full + 1 partial block)
// 2 compressions × 12 rounds = 24 gas
totalGas = 24n;

const NUM_BLOCKS = 100;

let bridgeGas = 0n;
const blockHashes: Uint8Array[] = [];

for (let i = 0; i < NUM_BLOCKS; i++) {
	// Simulate block header with different nonce
	const header = new Uint8Array(140);
	header.set([0x04, 0x00, 0x00, 0x00]);
	header.set(
		[i & 0xff, (i >> 8) & 0xff, (i >> 16) & 0xff, (i >> 24) & 0xff],
		136,
	); // nonce

	const hash = blake2bZcash(header);
	blockHashes.push(hash);

	// Each header: 2 compressions × 12 rounds = 24 gas
	bridgeGas += 24n;
}
for (let i = 0; i < 3; i++) {
	const hashHex = Array.from(blockHashes[i])
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

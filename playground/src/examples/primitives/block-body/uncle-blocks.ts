import Address from "../../../primitives/Address/index.js";
// Uncle Blocks: Working with ommers/uncle blocks (pre-merge)
import * as BlockBody from "../../../primitives/BlockBody/index.js";
import Transaction from "../../../primitives/Transaction/index.js";
import type { UncleType } from "../../../src/primitives/Uncle/UncleType.ts";

// Create sample uncle block header
const uncle1: UncleType = {
	parentHash: new Uint8Array(32),
	ommersHash: new Uint8Array(32),
	beneficiary: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	stateRoot: new Uint8Array(32),
	transactionsRoot: new Uint8Array(32),
	receiptsRoot: new Uint8Array(32),
	logsBloom: new Uint8Array(256),
	difficulty: 15_000_000_000_000n,
	number: 12345678n,
	gasLimit: 30_000_000n,
	gasUsed: 21_000_000n,
	timestamp: 1620000000n,
	extraData: new Uint8Array(),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
};

const uncle2: UncleType = {
	parentHash: new Uint8Array(32),
	ommersHash: new Uint8Array(32),
	beneficiary: Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
	stateRoot: new Uint8Array(32),
	transactionsRoot: new Uint8Array(32),
	receiptsRoot: new Uint8Array(32),
	logsBloom: new Uint8Array(256),
	difficulty: 14_800_000_000_000n,
	number: 12345679n,
	gasLimit: 30_000_000n,
	gasUsed: 18_500_000n,
	timestamp: 1620000013n,
	extraData: new Uint8Array(),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
};

// Transaction
const tx: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

// Block with uncle blocks
const blockWithUncles = BlockBody.from({
	transactions: [tx],
	ommers: [uncle1, uncle2],
});
blockWithUncles.ommers.forEach((uncle, i) => {});
const postMergeBlock = BlockBody.from({
	transactions: [tx],
	ommers: [], // Always empty post-merge
});

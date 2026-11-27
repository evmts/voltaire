import { parseHexByte } from "../primitives/Hex/parseHexByte.js";

/**
 * Records mock RPC data and makes it accessible to Zig mock vtable
 *
 * Strategy:
 * 1. Extract all mock data from MockRpcClient
 * 2. Serialize into flat C-compatible buffers
 * 3. Pass buffer pointers to Zig via FFI
 * 4. Zig mock vtable reads from buffers instead of making real RPC calls
 */

import type {
	MockAccountState,
	MockBlock,
	MockRpcClient,
} from "../provider/test-utils/MockRpcClient.js";

export interface RecordedAccount {
	address: string;
	balance: bigint;
	nonce: bigint;
	code: string;
	storageSlots: Array<{ slot: bigint; value: bigint }>;
}

export interface RecordedBlock {
	number: bigint;
	hash: string;
	parentHash: string;
	timestamp: bigint;
	gasLimit: bigint;
	gasUsed: bigint;
	baseFeePerGas?: bigint;
	miner: string;
	transactions: string[];
}

export interface RecordedData {
	accounts: RecordedAccount[];
	blocks: RecordedBlock[];
	forkBlockNumber: bigint;
}

/**
 * Extract all mock data from MockRpcClient
 */
export function recordMockData(mockRpc: MockRpcClient): RecordedData {
	type MockRpcClientInternal = {
		accounts: Map<string, MockAccountState>;
		blocksByNumber: Map<bigint, MockBlock>;
		currentBlockNumber: bigint;
	};

	// Access private fields via type assertion
	const rpc = mockRpc as unknown as MockRpcClientInternal;

	const accounts: RecordedAccount[] = [];
	for (const [address, state] of rpc.accounts.entries()) {
		const storageSlots = Array.from(
			state.storage.entries() as IterableIterator<[bigint, bigint]>,
		).map(([slot, value]) => ({
			slot,
			value,
		}));

		accounts.push({
			address,
			balance: state.balance,
			nonce: state.nonce,
			code: state.code,
			storageSlots,
		});
	}

	const blocks: RecordedBlock[] = [];
	for (const [_, block] of rpc.blocksByNumber.entries()) {
		blocks.push({
			number: block.number,
			hash: block.hash,
			parentHash: block.parentHash,
			timestamp: block.timestamp,
			gasLimit: block.gasLimit,
			gasUsed: block.gasUsed,
			baseFeePerGas: block.baseFeePerGas,
			miner: block.miner,
			transactions: block.transactions,
		});
	}

	return {
		accounts,
		blocks,
		forkBlockNumber: rpc.currentBlockNumber,
	};
}

function computeSerializedSize(
	data: RecordedData,
	encoder: TextEncoder,
): number {
	let size = 16; // Header: 4 + 4 + 8
	for (const account of data.accounts) {
		const codeBytes = encoder.encode(account.code);
		size += 20 + 32 + 8 + 4 + codeBytes.length + 4;
		size += account.storageSlots.length * 64;
	}
	for (const block of data.blocks) {
		size += 8 + 66 + 66 + 8 + 8 + 8 + 8 + 42 + 4;
		size += block.transactions.reduce((sum, tx) => sum + tx.length + 1, 0);
	}
	return size;
}

function writeAccountRecord(
	buffer: Uint8Array,
	view: DataView,
	startOffset: number,
	account: RecordedAccount,
	encoder: TextEncoder,
): number {
	let offset = startOffset;
	buffer.set(hexToBytes(account.address), offset);
	offset += 20;

	const balanceHex = account.balance.toString(16).padStart(64, "0");
	buffer.set(hexToBytes(`0x${balanceHex}`), offset);
	offset += 32;

	view.setBigUint64(offset, account.nonce, true);
	offset += 8;

	const codeBytes = encoder.encode(account.code);
	view.setUint32(offset, codeBytes.length, true);
	offset += 4;
	buffer.set(codeBytes, offset);
	offset += codeBytes.length;

	view.setUint32(offset, account.storageSlots.length, true);
	offset += 4;
	for (const { slot, value } of account.storageSlots) {
		buffer.set(hexToBytes(`0x${slot.toString(16).padStart(64, "0")}`), offset);
		offset += 32;
		buffer.set(hexToBytes(`0x${value.toString(16).padStart(64, "0")}`), offset);
		offset += 32;
	}
	return offset;
}

/**
 * Serialize recorded data into C-compatible format for FFI
 *
 * Layout:
 * - Header: [num_accounts: u32, num_blocks: u32, fork_block_number: u64]
 * - Account entries: [address: 20 bytes, balance: 32 bytes, nonce: 8 bytes, code_len: u32, code: bytes, storage_count: u32, storage_entries...]
 * - Block entries: [number: u64, hash: 32 bytes, ...]
 */
export function serializeMockData(data: RecordedData): Uint8Array {
	const encoder = new TextEncoder();
	const buffer = new Uint8Array(computeSerializedSize(data, encoder));
	const view = new DataView(buffer.buffer);
	let offset = 0;

	view.setUint32(offset, data.accounts.length, true);
	offset += 4;
	view.setUint32(offset, data.blocks.length, true);
	offset += 4;
	view.setBigUint64(offset, data.forkBlockNumber, true);
	offset += 8;

	for (const account of data.accounts) {
		offset = writeAccountRecord(buffer, view, offset, account, encoder);
	}

	for (const block of data.blocks) {
		view.setBigUint64(offset, block.number, true);
		offset += 8;
		const hashBytes = encoder.encode(`${block.hash}\0`);
		buffer.set(hashBytes, offset);
		offset += hashBytes.length;
	}

	return buffer;
}

function hexToBytes(hex: string): Uint8Array {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseHexByte(clean, i * 2);
	}
	return bytes;
}

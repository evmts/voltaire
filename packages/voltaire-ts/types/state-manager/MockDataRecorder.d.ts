/**
 * Records mock RPC data and makes it accessible to Zig mock vtable
 *
 * Strategy:
 * 1. Extract all mock data from MockRpcClient
 * 2. Serialize into flat C-compatible buffers
 * 3. Pass buffer pointers to Zig via FFI
 * 4. Zig mock vtable reads from buffers instead of making real RPC calls
 */
import type { MockRpcClient } from "../provider/test-utils/MockRpcClient.js";
export interface RecordedAccount {
    address: string;
    balance: bigint;
    nonce: bigint;
    code: string;
    storageSlots: Array<{
        slot: bigint;
        value: bigint;
    }>;
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
export declare function recordMockData(mockRpc: MockRpcClient): RecordedData;
/**
 * Serialize recorded data into C-compatible format for FFI
 *
 * Layout:
 * - Header: [num_accounts: u32, num_blocks: u32, fork_block_number: u64]
 * - Account entries: [address: 20 bytes, balance: 32 bytes, nonce: 8 bytes, code_len: u32, code: bytes, storage_count: u32, storage_entries...]
 * - Block entries: [number: u64, hash: 32 bytes, ...]
 */
export declare function serializeMockData(data: RecordedData): Uint8Array;
//# sourceMappingURL=MockDataRecorder.d.ts.map
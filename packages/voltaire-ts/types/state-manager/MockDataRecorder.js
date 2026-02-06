/**
 * Records mock RPC data and makes it accessible to Zig mock vtable
 *
 * Strategy:
 * 1. Extract all mock data from MockRpcClient
 * 2. Serialize into flat C-compatible buffers
 * 3. Pass buffer pointers to Zig via FFI
 * 4. Zig mock vtable reads from buffers instead of making real RPC calls
 */
/**
 * Extract all mock data from MockRpcClient
 */
export function recordMockData(mockRpc) {
    // Access private fields via type assertion
    const rpc = mockRpc;
    const accounts = [];
    for (const [address, state] of rpc.accounts.entries()) {
        const storageSlots = Array.from(state.storage.entries()).map(([slot, value]) => ({
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
    const blocks = [];
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
/**
 * Serialize recorded data into C-compatible format for FFI
 *
 * Layout:
 * - Header: [num_accounts: u32, num_blocks: u32, fork_block_number: u64]
 * - Account entries: [address: 20 bytes, balance: 32 bytes, nonce: 8 bytes, code_len: u32, code: bytes, storage_count: u32, storage_entries...]
 * - Block entries: [number: u64, hash: 32 bytes, ...]
 */
export function serializeMockData(data) {
    const encoder = new TextEncoder();
    // Calculate total size
    let size = 16; // Header: 4 + 4 + 8
    for (const account of data.accounts) {
        size += 20; // address
        size += 32; // balance
        size += 8; // nonce
        const codeBytes = encoder.encode(account.code);
        size += 4 + codeBytes.length; // code_len + code
        size += 4; // storage_count
        size += account.storageSlots.length * (32 + 32); // slot + value pairs
    }
    for (const block of data.blocks) {
        size += 8; // number
        size += 66; // hash hex string (0x + 64 chars)
        size += 66; // parentHash
        size += 8; // timestamp
        size += 8; // gasLimit
        size += 8; // gasUsed
        size += 8; // baseFeePerGas (or 0)
        size += 42; // miner address
        size += 4; // tx count
        size += block.transactions.reduce((sum, tx) => sum + tx.length + 1, 0); // txs
    }
    const buffer = new Uint8Array(size);
    const view = new DataView(buffer.buffer);
    let offset = 0;
    // Write header
    view.setUint32(offset, data.accounts.length, true);
    offset += 4;
    view.setUint32(offset, data.blocks.length, true);
    offset += 4;
    view.setBigUint64(offset, data.forkBlockNumber, true);
    offset += 8;
    // Write accounts
    for (const account of data.accounts) {
        // Address (20 bytes)
        const addrBytes = hexToBytes(account.address);
        buffer.set(addrBytes, offset);
        offset += 20;
        // Balance (32 bytes, big-endian u256)
        const balanceHex = account.balance.toString(16).padStart(64, "0");
        const balanceBytes = hexToBytes(`0x${balanceHex}`);
        buffer.set(balanceBytes, offset);
        offset += 32;
        // Nonce (8 bytes, little-endian u64)
        view.setBigUint64(offset, account.nonce, true);
        offset += 8;
        // Code
        const codeBytes = encoder.encode(account.code);
        view.setUint32(offset, codeBytes.length, true);
        offset += 4;
        buffer.set(codeBytes, offset);
        offset += codeBytes.length;
        // Storage
        view.setUint32(offset, account.storageSlots.length, true);
        offset += 4;
        for (const { slot, value } of account.storageSlots) {
            const slotHex = slot.toString(16).padStart(64, "0");
            const slotBytes = hexToBytes(`0x${slotHex}`);
            buffer.set(slotBytes, offset);
            offset += 32;
            const valueHex = value.toString(16).padStart(64, "0");
            const valueBytes = hexToBytes(`0x${valueHex}`);
            buffer.set(valueBytes, offset);
            offset += 32;
        }
    }
    // Write blocks (simplified for now - just number and hash)
    for (const block of data.blocks) {
        view.setBigUint64(offset, block.number, true);
        offset += 8;
        const hashBytes = encoder.encode(`${block.hash}\0`);
        buffer.set(hashBytes, offset);
        offset += hashBytes.length;
    }
    return buffer;
}
function hexToBytes(hex) {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

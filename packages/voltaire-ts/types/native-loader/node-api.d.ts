/**
 * Node-API loader for native bindings
 * Uses Node.js native addon loading for compatibility
 */
/**
 * Native module interface (loaded via require/dlopen)
 */
export interface NativeModule {
    primitives_address_from_hex(hex: string, output: Uint8Array): number;
    primitives_address_to_hex(address: Uint8Array, output: Uint8Array): number;
    primitives_address_to_checksum_hex(address: Uint8Array, output: Uint8Array): number;
    primitives_address_is_zero(address: Uint8Array): boolean;
    primitives_address_equals(a: Uint8Array, b: Uint8Array): boolean;
    primitives_keccak256(data: Uint8Array, length: number, output: Uint8Array): number;
    primitives_hash_to_hex(hash: Uint8Array, output: Uint8Array): number;
    primitives_hash_from_hex(hex: string, output: Uint8Array): number;
    primitives_hash_equals(a: Uint8Array, b: Uint8Array): boolean;
    primitives_hex_to_bytes(hex: string, output: Uint8Array, lengthOut: Uint8Array): number;
    primitives_bytes_to_hex(bytes: Uint8Array, length: number, output: Uint8Array, lengthOut: Uint8Array): number;
    primitives_secp256k1_recover_address(hash: Uint8Array, recoveryId: number, signature: Uint8Array, output: Uint8Array): number;
    secp256k1Sign(hash: Uint8Array, privateKey: Uint8Array, output: Uint8Array): number;
    secp256k1Verify(hash: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean;
    secp256k1DerivePublicKey(privateKey: Uint8Array, output: Uint8Array): number;
    primitives_sha256(data: Uint8Array, length: number, output: Uint8Array): number;
    primitives_ripemd160(data: Uint8Array, length: number, output: Uint8Array): number;
    primitives_blake2b(data: Uint8Array, length: number, output: Uint8Array): number;
    primitives_solidity_keccak256(data: Uint8Array, length: number, output: Uint8Array): number;
    primitives_solidity_sha256(data: Uint8Array, length: number, output: Uint8Array): number;
    primitives_abi_compute_selector(signature: string, output: Uint8Array): number;
    state_manager_create(): number | null;
    state_manager_create_with_fork(forkBackend: number): number | null;
    state_manager_destroy(handle: number): void;
    state_manager_get_balance_sync(handle: number, addressHex: string, outBuffer: Uint8Array, bufferLen: number): number;
    state_manager_get_nonce_sync(handle: number, addressHex: string, outNonce: Uint8Array): number;
    state_manager_get_code_len_sync(handle: number, addressHex: string, outLen: Uint8Array): number;
    state_manager_get_code_sync(handle: number, addressHex: string, outBuffer: Uint8Array, bufferLen: number): number;
    state_manager_get_storage_sync(handle: number, addressHex: string, slotHex: string, outBuffer: Uint8Array, bufferLen: number): number;
    state_manager_set_balance(handle: number, addressHex: string, balanceHex: string): number;
    state_manager_set_nonce(handle: number, addressHex: string, nonce: number): number;
    state_manager_set_code(handle: number, addressHex: string, codePtr: Uint8Array, codeLen: number): number;
    state_manager_set_storage(handle: number, addressHex: string, slotHex: string, valueHex: string): number;
    state_manager_checkpoint(handle: number): number;
    state_manager_revert(handle: number): void;
    state_manager_commit(handle: number): void;
    state_manager_snapshot(handle: number, outSnapshotId: Uint8Array): number;
    state_manager_revert_to_snapshot(handle: number, snapshotId: number): number;
    state_manager_clear_caches(handle: number): void;
    state_manager_clear_fork_cache(handle: number): void;
    fork_backend_create(rpcClientPtr: number, rpcVtable: number, blockTag: string, maxCacheSize: number): number | null;
    fork_backend_destroy(handle: number): void;
    fork_backend_clear_cache(handle: number): void;
    fork_backend_next_request(handle: number, outRequestId: Uint8Array, outMethod: Uint8Array, methodBufLen: number, outMethodLen: Uint8Array, outParams: Uint8Array, paramsBufLen: number, outParamsLen: Uint8Array): number;
    fork_backend_continue(handle: number, requestId: number, responsePtr: Uint8Array, responseLen: number): number;
    blockchain_create(): number | null;
    blockchain_create_with_fork(forkCache: number): number | null;
    blockchain_destroy(handle: number): void;
    blockchain_get_block_by_hash(handle: number, blockHashPtr: Uint8Array, outBlockData: Uint8Array): number;
    blockchain_get_block_by_number(handle: number, number: number, outBlockData: Uint8Array): number;
    blockchain_get_canonical_hash(handle: number, number: number, outHash: Uint8Array): number;
    blockchain_get_head_block_number(handle: number, outNumber: Uint8Array): number;
    blockchain_put_block(handle: number, blockData: Uint8Array): number;
    blockchain_set_canonical_head(handle: number, blockHashPtr: Uint8Array): number;
    blockchain_has_block(handle: number, blockHashPtr: Uint8Array): boolean;
    blockchain_local_block_count(handle: number): number;
    blockchain_orphan_count(handle: number): number;
    blockchain_canonical_chain_length(handle: number): number;
    blockchain_is_fork_block(handle: number, number: number): boolean;
    fork_block_cache_create(rpcContext: number, vtableFetchByNumber: number, vtableFetchByHash: number, forkBlockNumber: number): number | null;
    fork_block_cache_destroy(handle: number): void;
    fork_block_cache_next_request(handle: number, outRequestId: Uint8Array, outMethod: Uint8Array, methodBufLen: number, outMethodLen: Uint8Array, outParams: Uint8Array, paramsBufLen: number, outParamsLen: Uint8Array): number;
    fork_block_cache_continue(handle: number, requestId: number, responsePtr: Uint8Array, responseLen: number): number;
}
/**
 * Load native library using Node.js addon mechanism
 * @throws Error if library cannot be loaded
 */
export declare function loadNodeNative(): NativeModule;
/**
 * Check if native library is loaded
 */
export declare function isLoaded(): boolean;
/**
 * Unload native library
 * Note: Node.js doesn't provide explicit unload, just clear reference
 */
export declare function unload(): void;
/**
 * Helper to check error code and throw if non-zero
 */
export declare function checkError(code: number, operation: string): void;
/**
 * Helper to allocate buffer for output
 */
export declare function allocateOutput(size: number): Uint8Array;
/**
 * Helper to allocate buffer for string output
 */
export declare function allocateStringOutput(size: number): {
    buffer: Uint8Array;
    ptr: Uint8Array;
};
//# sourceMappingURL=node-api.d.ts.map
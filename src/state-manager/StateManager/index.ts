/**
 * StateManager TypeScript FFI Bindings
 *
 * Wraps Zig StateManager implementation with async RPC support.
 * Manages pending requests for fork backend async operations.
 *
 * @module state-manager/StateManager
 */

import type { AddressType } from "../../primitives/Address/AddressType.js";
import * as Address from "../../primitives/Address/index.js";
import type { Hex } from "../../primitives/Hex/HexType.js";
import * as HexUtils from "../../primitives/Hex/index.js";

/**
 * FFI library exports (loaded from native or WASM)
 */
export interface StateManagerFFIExports {
	// Lifecycle
	state_manager_create(): bigint | null;
	state_manager_create_with_fork(forkBackend: bigint): bigint | null;
	state_manager_destroy(handle: bigint): void;

	fork_backend_create(
		rpcClientPtr: bigint,
		vtablePtr: bigint,
		blockTag: string,
		maxCacheSize: number,
	): bigint | null;
	fork_backend_destroy(handle: bigint): void;
	fork_backend_clear_cache(handle: bigint): void;

	// Sync state operations
	state_manager_get_balance_sync(
		handle: bigint,
		addressHex: string,
		outBuffer: Uint8Array,
		bufferLen: number,
	): number;
	state_manager_set_balance(
		handle: bigint,
		addressHex: string,
		balanceHex: string,
	): number;

	state_manager_get_nonce_sync(
		handle: bigint,
		addressHex: string,
		outNonce: BigUint64Array,
	): number;
	state_manager_set_nonce(
		handle: bigint,
		addressHex: string,
		nonce: bigint,
	): number;

	state_manager_get_storage_sync(
		handle: bigint,
		addressHex: string,
		slotHex: string,
		outBuffer: Uint8Array,
		bufferLen: number,
	): number;
	state_manager_set_storage(
		handle: bigint,
		addressHex: string,
		slotHex: string,
		valueHex: string,
	): number;

	state_manager_get_code_len_sync(
		handle: bigint,
		addressHex: string,
		outLen: BigUint64Array,
	): number;
	state_manager_get_code_sync(
		handle: bigint,
		addressHex: string,
		outBuffer: Uint8Array,
		bufferLen: number,
	): number;
	state_manager_set_code(
		handle: bigint,
		addressHex: string,
		codePtr: Uint8Array,
		codeLen: number,
	): number;

	// Checkpoint operations
	state_manager_checkpoint(handle: bigint): number;
	state_manager_revert(handle: bigint): void;
	state_manager_commit(handle: bigint): void;

	// Snapshot operations
	state_manager_snapshot(handle: bigint, outSnapshotId: BigUint64Array): number;
	state_manager_revert_to_snapshot(handle: bigint, snapshotId: bigint): number;

	// Cache management
	state_manager_clear_caches(handle: bigint): void;
	state_manager_clear_fork_cache(handle: bigint): void;
}

/**
 * Error codes from c_api.zig
 */
export const STATE_MANAGER_SUCCESS = 0;
export const STATE_MANAGER_ERROR_INVALID_INPUT = -1;
export const STATE_MANAGER_ERROR_OUT_OF_MEMORY = -2;
export const STATE_MANAGER_ERROR_INVALID_SNAPSHOT = -3;
export const STATE_MANAGER_ERROR_RPC_FAILED = -4;
export const STATE_MANAGER_ERROR_INVALID_HEX = -5;

/**
 * RPC Client interface (must be implemented by adapter)
 */
export interface RpcClient {
	/**
	 * Get account proof (eth_getProof)
	 */
	getProof(
		address: AddressType,
		slots: readonly Hex[],
		blockTag: string,
	): Promise<EthProof>;

	/**
	 * Get contract code (eth_getCode)
	 */
	getCode(address: AddressType, blockTag: string): Promise<Hex>;
}

/**
 * eth_getProof response structure
 */
export interface EthProof {
	nonce: bigint;
	balance: bigint;
	codeHash: Hex;
	storageRoot: Hex;
	storageProof: Array<{
		key: Hex;
		value: Hex;
		proof: Hex[];
	}>;
}

/**
 * StateManager options
 */
export interface StateManagerOptions {
	/**
	 * Optional RPC client for fork mode
	 */
	rpcClient?: RpcClient;

	/**
	 * Block tag for fork (e.g., "latest", "0x123...")
	 */
	forkBlockTag?: string;

	/**
	 * Max LRU cache size for fork backend
	 */
	maxCacheSize?: number;

	/**
	 * FFI exports (loaded from native-loader)
	 */
	ffi: StateManagerFFIExports;
}

/**
 * StateManager TypeScript wrapper
 *
 * Manages Zig StateManager instance and provides async state operations.
 * Tracks pending RPC requests for fork backend continuations.
 *
 * @example
 * ```typescript
 * const manager = new StateManager({
 *   rpcClient: new RpcClientAdapter(httpProvider),
 *   forkBlockTag: '0x112a880',
 *   maxCacheSize: 10000,
 *   ffi: ffiExports
 * });
 *
 * // State operations
 * const balance = await manager.getBalance(address);
 * await manager.setBalance(address, 1000n);
 *
 * // Snapshots
 * const snapId = await manager.snapshot();
 * await manager.setBalance(address, 2000n);
 * await manager.revertToSnapshot(snapId);
 * ```
 */
export class StateManager {
	private handle: bigint;
	private forkBackendHandle: bigint | null = null;
	private ffi: StateManagerFFIExports;

	constructor(options: StateManagerOptions) {
		this.ffi = options.ffi;

		// Create fork backend if RPC client provided
		if (options.rpcClient) {
			const blockTag = options.forkBlockTag ?? "latest";
			const maxCacheSize = options.maxCacheSize ?? 10000;

			// Create RPC vtable (TypeScript functions wrapped for Zig callback)
			const vtable = this.createRpcVtable(options.rpcClient);

			this.forkBackendHandle = this.ffi.fork_backend_create(
				0n, // rpcClientPtr (vtable is enough)
				vtable,
				this.encodeCString(blockTag) as unknown as string,
				maxCacheSize,
			);

			if (!this.forkBackendHandle) {
				throw new Error("Failed to create fork backend");
			}

			// Create StateManager with fork
			const handle = this.ffi.state_manager_create_with_fork(
				this.forkBackendHandle,
			);
			if (!handle) {
				this.ffi.fork_backend_destroy(this.forkBackendHandle);
				throw new Error("Failed to create StateManager with fork");
			}
			this.handle = handle;
		} else {
			// Create in-memory only StateManager
			const handle = this.ffi.state_manager_create();
			if (!handle) {
				throw new Error("Failed to create StateManager");
			}
			this.handle = handle;
		}
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		this.ffi.state_manager_destroy(this.handle);
		if (this.forkBackendHandle) {
			this.ffi.fork_backend_destroy(this.forkBackendHandle);
		}
	}

	/**
	 * Encode string as null-terminated buffer for FFI
	 * Workaround for Bun FFI cstring bug in 1.2.20
	 */
	private encodeCString(str: string): Uint8Array {
		return new TextEncoder().encode(`${str}\0`);
	}

	/**
	 * Create RPC vtable for Zig callbacks
	 * In real implementation, this would use FFI to create function pointers
	 * For now, we store the client and call it synchronously
	 */
	private createRpcVtable(_rpcClient: RpcClient): bigint {
		// TODO: Implement actual vtable creation with FFI function pointers
		// This is a placeholder - real implementation needs:
		// 1. Create C function pointers for getProof/getCode
		// 2. Store callbacks in global registry
		// 3. Return vtable pointer as bigint
		return 0n;
	}

	// ========================================================================
	// State Operations
	// ========================================================================

	/**
	 * Get account balance
	 */
	async getBalance(address: AddressType): Promise<bigint> {
		const addressHex = Address.toHex(address);
		const buffer = new Uint8Array(67); // "0x" + 64 hex + null

		const result = this.ffi.state_manager_get_balance_sync(
			this.handle,
			this.encodeCString(addressHex) as unknown as string,
			buffer,
			buffer.length,
		);

		if (result !== STATE_MANAGER_SUCCESS) {
			throw new Error(`Failed to get balance: error ${result}`);
		}

		// Convert null-terminated C string to JS string
		const nullIndex = buffer.indexOf(0);
		const hexString = new TextDecoder().decode(buffer.subarray(0, nullIndex));

		return BigInt(hexString);
	}

	/**
	 * Set account balance
	 */
	async setBalance(address: AddressType, balance: bigint): Promise<void> {
		const addressHex = Address.toHex(address);
		const balanceHex = `0x${balance.toString(16)}`;

		const result = this.ffi.state_manager_set_balance(
			this.handle,
			this.encodeCString(addressHex) as unknown as string,
			this.encodeCString(balanceHex) as unknown as string,
		);

		if (result !== STATE_MANAGER_SUCCESS) {
			throw new Error(`Failed to set balance: error ${result}`);
		}
	}

	/**
	 * Get account nonce
	 */
	async getNonce(address: AddressType): Promise<bigint> {
		const addressHex = Address.toHex(address);
		const outBuffer = new BigUint64Array(1);

		const result = this.ffi.state_manager_get_nonce_sync(
			this.handle,
			this.encodeCString(addressHex) as unknown as string,
			outBuffer,
		);

		if (result !== STATE_MANAGER_SUCCESS) {
			throw new Error(`Failed to get nonce: error ${result}`);
		}

		const nonce = outBuffer[0];
		if (nonce === undefined) {
			throw new Error("Failed to read nonce from buffer");
		}
		return nonce;
	}

	/**
	 * Set account nonce
	 */
	async setNonce(address: AddressType, nonce: bigint): Promise<void> {
		const addressHex = Address.toHex(address);

		const result = this.ffi.state_manager_set_nonce(
			this.handle,
			this.encodeCString(addressHex) as unknown as string,
			nonce,
		);

		if (result !== STATE_MANAGER_SUCCESS) {
			throw new Error(`Failed to set nonce: error ${result}`);
		}
	}

	/**
	 * Get storage slot value
	 */
	async getStorage(address: AddressType, slot: Hex): Promise<Hex> {
		const addressHex = Address.toHex(address);
		const buffer = new Uint8Array(67);

		const result = this.ffi.state_manager_get_storage_sync(
			this.handle,
			this.encodeCString(addressHex) as unknown as string,
			this.encodeCString(slot) as unknown as string,
			buffer,
			buffer.length,
		);

		if (result !== STATE_MANAGER_SUCCESS) {
			throw new Error(`Failed to get storage: error ${result}`);
		}

		const nullIndex = buffer.indexOf(0);
		return new TextDecoder().decode(buffer.subarray(0, nullIndex)) as Hex;
	}

	/**
	 * Set storage slot value
	 */
	async setStorage(address: AddressType, slot: Hex, value: Hex): Promise<void> {
		const addressHex = Address.toHex(address);

		const result = this.ffi.state_manager_set_storage(
			this.handle,
			this.encodeCString(addressHex) as unknown as string,
			this.encodeCString(slot) as unknown as string,
			this.encodeCString(value) as unknown as string,
		);

		if (result !== STATE_MANAGER_SUCCESS) {
			throw new Error(`Failed to set storage: error ${result}`);
		}
	}

	/**
	 * Get contract code
	 */
	async getCode(address: AddressType): Promise<Hex> {
		const addressHex = Address.toHex(address);

		// Get code length first
		const lenBuffer = new BigUint64Array(1);
		const lenResult = this.ffi.state_manager_get_code_len_sync(
			this.handle,
			this.encodeCString(addressHex) as unknown as string,
			lenBuffer,
		);

		if (lenResult !== STATE_MANAGER_SUCCESS) {
			throw new Error(`Failed to get code length: error ${lenResult}`);
		}

		const codeLen = Number(lenBuffer[0]);
		if (codeLen === 0) {
			return "0x" as Hex;
		}

		// Get code bytes
		const codeBuffer = new Uint8Array(codeLen);
		const codeResult = this.ffi.state_manager_get_code_sync(
			this.handle,
			this.encodeCString(addressHex) as unknown as string,
			codeBuffer,
			codeLen,
		);

		if (codeResult !== STATE_MANAGER_SUCCESS) {
			throw new Error(`Failed to get code: error ${codeResult}`);
		}

		return HexUtils.fromBytes(codeBuffer);
	}

	/**
	 * Set contract code
	 */
	async setCode(address: AddressType, code: Hex): Promise<void> {
		const addressHex = Address.toHex(address);
		const codeBytes = HexUtils.toBytes(code);

		const result = this.ffi.state_manager_set_code(
			this.handle,
			this.encodeCString(addressHex) as unknown as string,
			codeBytes,
			codeBytes.length,
		);

		if (result !== STATE_MANAGER_SUCCESS) {
			throw new Error(`Failed to set code: error ${result}`);
		}
	}

	// ========================================================================
	// Checkpoint Operations
	// ========================================================================

	/**
	 * Create checkpoint (can be reverted or committed)
	 */
	async checkpoint(): Promise<void> {
		const result = this.ffi.state_manager_checkpoint(this.handle);
		if (result !== STATE_MANAGER_SUCCESS) {
			throw new Error(`Failed to checkpoint: error ${result}`);
		}
	}

	/**
	 * Revert to last checkpoint
	 */
	revert(): void {
		this.ffi.state_manager_revert(this.handle);
	}

	/**
	 * Commit last checkpoint (merge into parent)
	 */
	commit(): void {
		this.ffi.state_manager_commit(this.handle);
	}

	// ========================================================================
	// Snapshot Operations (for tevm_snapshot/tevm_revert)
	// ========================================================================

	/**
	 * Create snapshot and return snapshot ID
	 */
	async snapshot(): Promise<bigint> {
		const outBuffer = new BigUint64Array(1);
		const result = this.ffi.state_manager_snapshot(this.handle, outBuffer);

		if (result !== STATE_MANAGER_SUCCESS) {
			throw new Error(`Failed to snapshot: error ${result}`);
		}

		const snapshotId = outBuffer[0];
		if (snapshotId === undefined) {
			throw new Error("Failed to read snapshot ID from buffer");
		}
		return snapshotId;
	}

	/**
	 * Revert to snapshot ID
	 */
	async revertToSnapshot(snapshotId: bigint): Promise<void> {
		const result = this.ffi.state_manager_revert_to_snapshot(
			this.handle,
			snapshotId,
		);

		if (result !== STATE_MANAGER_SUCCESS) {
			if (result === STATE_MANAGER_ERROR_INVALID_SNAPSHOT) {
				throw new Error(`Invalid snapshot ID: ${snapshotId}`);
			}
			throw new Error(`Failed to revert to snapshot: error ${result}`);
		}
	}

	// ========================================================================
	// Cache Management
	// ========================================================================

	/**
	 * Clear all caches (normal + fork)
	 */
	clearCaches(): void {
		this.ffi.state_manager_clear_caches(this.handle);
	}

	/**
	 * Clear only fork cache
	 */
	clearForkCache(): void {
		this.ffi.state_manager_clear_fork_cache(this.handle);
	}
}

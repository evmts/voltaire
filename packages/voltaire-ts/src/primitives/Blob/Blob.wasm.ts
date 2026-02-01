/**
 * WASM implementation of EIP-4844 Blob primitives
 * Uses WebAssembly bindings to Zig implementation for blob operations
 */

// Re-export pure TypeScript implementation
export * from "./Blob.js";

import * as loader from "../../wasm-loader/loader.js";

// ============================================================================
// WASM-Accelerated Functions
// ============================================================================

/**
 * Encode data as blob using WASM (with length prefix)
 * @param data - Data to encode (max ~131KB)
 * @returns Blob containing encoded data
 *
 * @example
 * ```typescript
 * const data = new TextEncoder().encode("Hello, blob!");
 * const blob = fromDataWasm(data);
 * ```
 */
export function fromDataWasm(data: Uint8Array): Uint8Array {
	return loader.blobFromData(data);
}

/**
 * Extract data from blob using WASM
 * @param blob - Blob data (131072 bytes)
 * @returns Original data
 *
 * @example
 * ```typescript
 * const data = toDataWasm(blob);
 * const text = new TextDecoder().decode(data);
 * ```
 */
export function toDataWasm(blob: Uint8Array): Uint8Array {
	return loader.blobToData(blob);
}

/**
 * Validate blob size using WASM
 * @param blobLen - Length to validate
 * @returns true if blob is exactly 131072 bytes
 *
 * @example
 * ```typescript
 * if (!isValidWasm(blob.length)) {
 *   throw new Error("Invalid blob");
 * }
 * ```
 */
export function isValidWasm(blobLen: number): boolean {
	return loader.blobIsValid(blobLen);
}

/**
 * Calculate blob gas for number of blobs using WASM
 * @param blobCount - Number of blobs
 * @returns Total blob gas
 *
 * @example
 * ```typescript
 * const gas = calculateGasWasm(3); // 393216n
 * ```
 */
export function calculateGasWasm(blobCount: number): bigint {
	return loader.blobCalculateGas(blobCount);
}

/**
 * Estimate number of blobs needed for data using WASM
 * @param dataSize - Size of data in bytes
 * @returns Number of blobs required
 *
 * @example
 * ```typescript
 * const blobCount = estimateBlobCountWasm(200000); // 2
 * ```
 */
export function estimateBlobCountWasm(dataSize: number): number {
	return loader.blobEstimateCount(dataSize);
}

/**
 * Calculate blob gas price from excess blob gas using WASM
 * @param excessBlobGas - Excess blob gas
 * @returns Blob gas price
 *
 * @example
 * ```typescript
 * const price = calculateGasPriceWasm(0n); // 1n (MIN_BLOB_BASE_FEE)
 * ```
 */
export function calculateGasPriceWasm(excessBlobGas: bigint): bigint {
	return loader.blobCalculateGasPrice(excessBlobGas);
}

/**
 * Calculate excess blob gas for next block using WASM
 * @param parentExcess - Parent block excess blob gas
 * @param parentUsed - Parent block blob gas used
 * @returns Excess blob gas for next block
 *
 * @example
 * ```typescript
 * const excess = calculateExcessGasWasm(0n, 524288n); // Excess from 4 blobs
 * ```
 */
export function calculateExcessGasWasm(
	parentExcess: bigint,
	parentUsed: bigint,
): bigint {
	return loader.blobCalculateExcessGas(parentExcess, parentUsed);
}

// ============================================================================
// Status Functions
// ============================================================================

/**
 * Check if WASM blob implementation is available
 * @returns true if WASM is loaded
 */
export function isWasmBlobAvailable(): boolean {
	try {
		loader.getExports();
		return true;
	} catch {
		return false;
	}
}

/**
 * Get implementation status
 * @returns Object with WASM availability status
 */
export function getImplementationStatus() {
	return {
		wasmAvailable: isWasmBlobAvailable(),
		primitives: {
			fromData: true,
			toData: true,
			isValid: true,
			calculateGas: true,
			estimateBlobCount: true,
			calculateGasPrice: true,
			calculateExcessGas: true,
		},
	};
}

/**
 * WASM implementation of EIP-4844 Blob primitives
 * Uses WebAssembly bindings to Zig implementation for blob operations
 */
export * from "./Blob.js";
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
export declare function fromDataWasm(data: Uint8Array): Uint8Array;
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
export declare function toDataWasm(blob: Uint8Array): Uint8Array;
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
export declare function isValidWasm(blobLen: number): boolean;
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
export declare function calculateGasWasm(blobCount: number): bigint;
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
export declare function estimateBlobCountWasm(dataSize: number): number;
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
export declare function calculateGasPriceWasm(excessBlobGas: bigint): bigint;
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
export declare function calculateExcessGasWasm(parentExcess: bigint, parentUsed: bigint): bigint;
/**
 * Check if WASM blob implementation is available
 * @returns true if WASM is loaded
 */
export declare function isWasmBlobAvailable(): boolean;
/**
 * Get implementation status
 * @returns Object with WASM availability status
 */
export declare function getImplementationStatus(): {
    wasmAvailable: boolean;
    primitives: {
        fromData: boolean;
        toData: boolean;
        isValid: boolean;
        calculateGas: boolean;
        estimateBlobCount: boolean;
        calculateGasPrice: boolean;
        calculateExcessGas: boolean;
    };
};
//# sourceMappingURL=Blob.wasm.d.ts.map
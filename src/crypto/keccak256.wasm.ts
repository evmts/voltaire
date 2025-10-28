/**
 * WASM Keccak256 Hash Function
 *
 * WASM-accelerated Keccak256 implementation using Zig stdlib.
 * Data-first API matching the Noble implementation.
 *
 * @example
 * ```typescript
 * import { Keccak256Wasm } from './keccak256.wasm.js';
 *
 * // Hash bytes
 * const hash = Keccak256Wasm.hash(data);
 *
 * // Hash string
 * const hash = Keccak256Wasm.hashString('hello');
 *
 * // Hash hex
 * const hash = Keccak256Wasm.hashHex('0x1234...');
 * ```
 */

import { Hash } from "../primitives/hash.js";

// ============================================================================
// WASM Interface
// ============================================================================

let wasmInstance: WebAssembly.Instance | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let memoryOffset = 0;

interface Keccak256WasmExports {
  memory: WebAssembly.Memory;
  keccak256Hash: (input_ptr: number, input_len: number, output_ptr: number) => void;
}

/**
 * Load WASM module
 */
async function loadWasm(): Promise<void> {
  if (wasmInstance) return;

  // Minimal WASI shim
  const wasi = {
    args_get: () => 0,
    args_sizes_get: () => 0,
    environ_get: () => 0,
    environ_sizes_get: () => 0,
    fd_write: () => 0,
    fd_read: () => 0,
    fd_close: () => 0,
    fd_seek: () => 0,
    fd_fdstat_get: () => 0,
    fd_filestat_get: () => 0,
    fd_pread: () => 0,
    fd_pwrite: () => 0,
    clock_time_get: () => 0,
    random_get: () => 0,
    proc_exit: () => { throw new Error("WASI proc_exit"); },
    sched_yield: () => 0,
    poll_oneoff: () => 0,
    path_filestat_get: () => 0,
    path_open: () => 0,
    path_readlink: () => 0,
    fd_prestat_get: () => 0,
    fd_prestat_dir_name: () => 0,
    fd_datasync: () => 0,
    fd_sync: () => 0,
  };

  const importObject = {
    env: {},
    wasi_snapshot_preview1: wasi,
  };

  // Load from wasm/ directory
  const wasmPath = new URL("../../wasm/keccak256.wasm", import.meta.url);
  const response = await fetch(wasmPath);
  const buffer = await response.arrayBuffer();
  const wasmModule = await WebAssembly.instantiate(buffer, importObject);

  wasmInstance = wasmModule.instance;
  const exports = wasmInstance.exports as unknown as Keccak256WasmExports;
  wasmMemory = exports.memory;

  if (!wasmMemory) {
    throw new Error("WASM module does not export memory");
  }

  // Start allocations at 64KB
  memoryOffset = 64 * 1024;
}

/**
 * Allocate memory in WASM
 */
function malloc(size: number): number {
  if (!wasmMemory) {
    throw new Error("WASM memory not initialized");
  }

  const aligned = (size + 7) & ~7;
  const ptr = memoryOffset;
  memoryOffset += aligned;

  const pagesNeeded = Math.ceil(memoryOffset / 65536);
  const currentPages = wasmMemory.buffer.byteLength / 65536;

  if (pagesNeeded > currentPages) {
    const pagesToGrow = pagesNeeded - currentPages;
    wasmMemory.grow(pagesToGrow);
  }

  return ptr;
}

/**
 * Write bytes to WASM memory
 */
function writeBytes(data: Uint8Array, ptr: number): void {
  if (!wasmMemory) {
    throw new Error("WASM memory not initialized");
  }
  const memory = new Uint8Array(wasmMemory.buffer);
  memory.set(data, ptr);
}

/**
 * Read bytes from WASM memory
 */
function readBytes(ptr: number, length: number): Uint8Array {
  if (!wasmMemory) {
    throw new Error("WASM memory not initialized");
  }
  const memory = new Uint8Array(wasmMemory.buffer);
  return memory.slice(ptr, ptr + length);
}

/**
 * Reset memory allocator
 */
function resetMemory(): void {
  memoryOffset = 64 * 1024;
}

// ============================================================================
// Main Keccak256Wasm Namespace
// ============================================================================

export namespace Keccak256Wasm {
  // ==========================================================================
  // Constants
  // ==========================================================================

  /**
   * Digest size in bytes (32 bytes = 256 bits)
   */
  export const DIGEST_SIZE = 32;

  /**
   * Rate in bytes for Keccak256 (136 bytes = 1088 bits)
   */
  export const RATE = 136;

  /**
   * State size (25 u64 words = 1600 bits)
   */
  export const STATE_SIZE = 25;

  // ==========================================================================
  // Hashing Functions
  // ==========================================================================

  /**
   * Hash data with Keccak-256
   *
   * @param data - Data to hash
   * @returns 32-byte hash
   *
   * @example
   * ```typescript
   * const hash = Keccak256Wasm.hash(data);
   * ```
   */
  export function hash(data: Uint8Array): Hash {
    if (!wasmInstance) {
      throw new Error("WASM not loaded. Call loadWasm() first or use lazy initialization.");
    }

    const exports = wasmInstance.exports as unknown as Keccak256WasmExports;

    // Allocate input and output
    const inputPtr = malloc(data.length);
    const outputPtr = malloc(32);

    // Write input
    writeBytes(data, inputPtr);

    // Call WASM function
    exports.keccak256Hash(inputPtr, data.length, outputPtr);

    // Read output
    const result = readBytes(outputPtr, 32);

    // Reset memory for next call
    resetMemory();

    return result as Hash;
  }

  /**
   * Hash string with Keccak-256
   *
   * String is UTF-8 encoded before hashing.
   *
   * @param str - String to hash
   * @returns 32-byte hash
   *
   * @example
   * ```typescript
   * const hash = Keccak256Wasm.hashString('hello');
   * ```
   */
  export function hashString(str: string): Hash {
    const encoder = new TextEncoder();
    return hash(encoder.encode(str));
  }

  /**
   * Hash hex string with Keccak-256
   *
   * @param hex - Hex string to hash (with or without 0x prefix)
   * @returns 32-byte hash
   * @throws If hex string is invalid or has odd length
   *
   * @example
   * ```typescript
   * const hash = Keccak256Wasm.hashHex('0x1234...');
   * ```
   */
  export function hashHex(hex: string): Hash {
    const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (!/^[0-9a-fA-F]*$/.test(normalized)) {
      throw new Error("Invalid hex string");
    }
    if (normalized.length % 2 !== 0) {
      throw new Error("Hex string must have even length");
    }
    const bytes = new Uint8Array(normalized.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
    }
    return hash(bytes);
  }

  /**
   * Hash multiple data chunks in sequence
   *
   * Equivalent to hashing the concatenation of all chunks.
   *
   * @param chunks - Array of data chunks to hash
   * @returns 32-byte hash
   *
   * @example
   * ```typescript
   * const hash = Keccak256Wasm.hashMultiple([data1, data2, data3]);
   * ```
   */
  export function hashMultiple(chunks: readonly Uint8Array[]): Hash {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    return hash(combined);
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Compute function selector (first 4 bytes of Keccak-256 hash)
   *
   * Used for Ethereum function signatures.
   *
   * @param signature - Function signature string
   * @returns 4-byte selector
   *
   * @example
   * ```typescript
   * const selector = Keccak256Wasm.selector('transfer(address,uint256)');
   * // Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
   * ```
   */
  export function selector(signature: string): Uint8Array {
    const digest = hashString(signature);
    return digest.slice(0, 4);
  }

  /**
   * Compute event topic (32-byte Keccak-256 hash)
   *
   * Used for Ethereum event signatures.
   *
   * @param signature - Event signature string
   * @returns 32-byte topic
   *
   * @example
   * ```typescript
   * const topic = Keccak256Wasm.topic('Transfer(address,address,uint256)');
   * ```
   */
  export function topic(signature: string): Hash {
    return hashString(signature);
  }

  /**
   * Compute contract address from deployer and nonce
   *
   * Uses CREATE formula: keccak256(rlp([sender, nonce]))[12:]
   *
   * @param sender - Deployer address (20 bytes)
   * @param nonce - Transaction nonce
   * @returns Contract address (20 bytes)
   *
   * @example
   * ```typescript
   * const address = Keccak256Wasm.contractAddress(sender, nonce);
   * ```
   */
  export function contractAddress(sender: Uint8Array, nonce: bigint): Uint8Array {
    if (sender.length !== 20) {
      throw new Error("Sender must be 20 bytes");
    }
    // Simplified version - full RLP encoding needed for production
    const data = new Uint8Array([...sender, ...nonceToBytes(nonce)]);
    const digest = hash(data);
    return digest.slice(12);
  }

  /**
   * Compute CREATE2 address
   *
   * Uses CREATE2 formula: keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]
   *
   * @param sender - Deployer address (20 bytes)
   * @param salt - 32-byte salt
   * @param initCodeHash - Hash of initialization code
   * @returns Contract address (20 bytes)
   *
   * @example
   * ```typescript
   * const address = Keccak256Wasm.create2Address(sender, salt, initCodeHash);
   * ```
   */
  export function create2Address(
    sender: Uint8Array,
    salt: Uint8Array,
    initCodeHash: Uint8Array,
  ): Uint8Array {
    if (sender.length !== 20) {
      throw new Error("Sender must be 20 bytes");
    }
    if (salt.length !== 32) {
      throw new Error("Salt must be 32 bytes");
    }
    if (initCodeHash.length !== 32) {
      throw new Error("Init code hash must be 32 bytes");
    }
    const data = new Uint8Array(1 + 20 + 32 + 32);
    data[0] = 0xff;
    data.set(sender, 1);
    data.set(salt, 21);
    data.set(initCodeHash, 53);
    const digest = hash(data);
    return digest.slice(12);
  }

  /**
   * Helper: Convert nonce to minimal bytes
   */
  function nonceToBytes(nonce: bigint): Uint8Array {
    if (nonce === 0n) {
      return new Uint8Array([0x80]); // RLP empty list
    }
    const hex = nonce.toString(16);
    const paddedHex = hex.length % 2 ? `0${hex}` : hex;
    const bytes = new Uint8Array(paddedHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Number.parseInt(paddedHex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  /**
   * Initialize WASM module
   *
   * Must be called before using any Keccak256Wasm functions.
   *
   * @example
   * ```typescript
   * await Keccak256Wasm.init();
   * const hash = Keccak256Wasm.hash(data);
   * ```
   */
  export async function init(): Promise<void> {
    await loadWasm();
  }
}

// Re-export namespace as default
export default Keccak256Wasm;

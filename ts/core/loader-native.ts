/**
 * Native FFI loader for Ethereum primitives library
 *
 * Uses node-ffi-napi to load native shared library (.so, .dylib, .dll)
 * Provides typed bindings to C API functions from primitives.h
 */

import type { Library } from 'ffi-napi';

/**
 * C types for FFI bindings
 * Maps C types to node-ffi-napi type strings
 */
export const FFI_TYPES = {
  // Primitives
  int: 'int',
  bool: 'bool',
  uint8: 'uint8',
  uint64: 'uint64',
  size_t: 'size_t',
  void: 'void',

  // Pointers
  string: 'string', // const char* (null-terminated)
  pointer: 'pointer', // void* or uint8_t*
  uint8_ptr: 'pointer', // uint8_t*
  char_ptr: 'string', // const char*
} as const;

/**
 * FFI function signatures for primitives C API
 * Based on primitives.h
 */
export const FFI_SIGNATURES = {
  // Address API
  primitives_address_from_hex: [FFI_TYPES.int, [FFI_TYPES.string, FFI_TYPES.pointer]],
  primitives_address_to_hex: [FFI_TYPES.int, [FFI_TYPES.pointer, FFI_TYPES.uint8_ptr]],
  primitives_address_to_checksum_hex: [FFI_TYPES.int, [FFI_TYPES.pointer, FFI_TYPES.uint8_ptr]],
  primitives_address_is_zero: [FFI_TYPES.bool, [FFI_TYPES.pointer]],
  primitives_address_equals: [FFI_TYPES.bool, [FFI_TYPES.pointer, FFI_TYPES.pointer]],
  primitives_address_validate_checksum: [FFI_TYPES.bool, [FFI_TYPES.string]],

  // Keccak-256 API
  primitives_keccak256: [FFI_TYPES.int, [FFI_TYPES.uint8_ptr, FFI_TYPES.size_t, FFI_TYPES.pointer]],
  primitives_hash_to_hex: [FFI_TYPES.int, [FFI_TYPES.pointer, FFI_TYPES.uint8_ptr]],
  primitives_hash_from_hex: [FFI_TYPES.int, [FFI_TYPES.string, FFI_TYPES.pointer]],
  primitives_hash_equals: [FFI_TYPES.bool, [FFI_TYPES.pointer, FFI_TYPES.pointer]],

  // Hex utilities API
  primitives_hex_to_bytes: [FFI_TYPES.int, [FFI_TYPES.string, FFI_TYPES.uint8_ptr, FFI_TYPES.size_t]],
  primitives_bytes_to_hex: [
    FFI_TYPES.int,
    [FFI_TYPES.uint8_ptr, FFI_TYPES.size_t, FFI_TYPES.uint8_ptr, FFI_TYPES.size_t],
  ],

  // U256 API
  primitives_u256_from_hex: [FFI_TYPES.int, [FFI_TYPES.string, FFI_TYPES.pointer]],
  primitives_u256_to_hex: [FFI_TYPES.int, [FFI_TYPES.pointer, FFI_TYPES.uint8_ptr, FFI_TYPES.size_t]],

  // EIP-191 API
  primitives_eip191_hash_message: [FFI_TYPES.int, [FFI_TYPES.uint8_ptr, FFI_TYPES.size_t, FFI_TYPES.pointer]],

  // Address derivation API
  primitives_calculate_create_address: [FFI_TYPES.int, [FFI_TYPES.pointer, FFI_TYPES.uint64, FFI_TYPES.pointer]],

  // Version info
  primitives_version_string: [FFI_TYPES.string, []],
} as const;

/**
 * Native library function bindings
 * Typed wrapper around ffi-napi Library
 */
export interface NativeExports {
  // Address API
  primitives_address_from_hex(hex: string, out_address: Buffer): number;
  primitives_address_to_hex(address: Buffer, buf: Buffer): number;
  primitives_address_to_checksum_hex(address: Buffer, buf: Buffer): number;
  primitives_address_is_zero(address: Buffer): boolean;
  primitives_address_equals(a: Buffer, b: Buffer): boolean;
  primitives_address_validate_checksum(hex: string): boolean;

  // Keccak-256 API
  primitives_keccak256(data: Buffer, data_len: number, out_hash: Buffer): number;
  primitives_hash_to_hex(hash: Buffer, buf: Buffer): number;
  primitives_hash_from_hex(hex: string, out_hash: Buffer): number;
  primitives_hash_equals(a: Buffer, b: Buffer): boolean;

  // Hex utilities API
  primitives_hex_to_bytes(hex: string, out_buf: Buffer, buf_len: number): number;
  primitives_bytes_to_hex(data: Buffer, data_len: number, out_buf: Buffer, buf_len: number): number;

  // U256 API
  primitives_u256_from_hex(hex: string, out_u256: Buffer): number;
  primitives_u256_to_hex(value_u256: Buffer, buf: Buffer, buf_len: number): number;

  // EIP-191 API
  primitives_eip191_hash_message(message: Buffer, message_len: number, out_hash: Buffer): number;

  // Address derivation API
  primitives_calculate_create_address(sender: Buffer, nonce: bigint, out_address: Buffer): number;

  // Version info
  primitives_version_string(): string;
}

/**
 * Loaded native library state
 */
export interface LoadedNative {
  library: Library;
  exports: NativeExports;
}

/**
 * Native loader configuration
 */
export interface NativeLoaderConfig {
  /**
   * Path to shared library file
   * - Linux: libprimitives_c.so
   * - macOS: libprimitives_c.dylib
   * - Windows: primitives_c.dll
   *
   * If not provided, will search standard locations:
   * - ./zig-out/lib/
   * - ./target/release/
   * - System library paths
   */
  libraryPath?: string;

  /**
   * Library name without extension (for automatic platform detection)
   * Default: 'primitives_c'
   */
  libraryName?: string;
}

/**
 * Detect platform and get appropriate library extension
 */
function getLibraryExtension(): string {
  const platform = process.platform;
  switch (platform) {
    case 'darwin':
      return '.dylib';
    case 'win32':
      return '.dll';
    case 'linux':
    default:
      return '.so';
  }
}

/**
 * Detect platform and get library prefix
 */
function getLibraryPrefix(): string {
  return process.platform === 'win32' ? '' : 'lib';
}

/**
 * Find library in standard locations
 */
function findLibrary(libraryName: string): string {
  const prefix = getLibraryPrefix();
  const ext = getLibraryExtension();
  const filename = `${prefix}${libraryName}${ext}`;

  // Search paths (relative to project root)
  const searchPaths = [
    `./zig-out/lib/${filename}`,
    `./target/release/${filename}`,
    `./lib/${filename}`,
    `./build/${filename}`,
    filename, // Try system paths
  ];

  // For now, return first path (actual file existence check would require fs)
  // This will be resolved by node-ffi-napi which searches library paths
  return searchPaths[0];
}

/**
 * Load native library via FFI
 *
 * @param config Loader configuration
 * @returns Loaded native library with typed exports
 *
 * @example
 * ```ts
 * const native = await loadNative({
 *   libraryPath: './zig-out/lib/libprimitives_c.dylib'
 * });
 * ```
 */
export async function loadNative(config: NativeLoaderConfig = {}): Promise<LoadedNative> {
  // Dynamic import to avoid requiring ffi-napi in WASM environments
  let ffi: typeof import('ffi-napi');
  try {
    ffi = await import('ffi-napi');
  } catch (error) {
    throw new Error(
      'ffi-napi not available. Install with: npm install ffi-napi\n' +
        'Note: ffi-napi requires native compilation and may need python/build tools.',
    );
  }

  const libraryName = config.libraryName || 'primitives_c';
  const libraryPath = config.libraryPath || findLibrary(libraryName);

  // Load library with FFI bindings
  let library: Library;
  try {
    library = ffi.Library(libraryPath, FFI_SIGNATURES as any);
  } catch (error) {
    throw new Error(
      `Failed to load native library from ${libraryPath}\n` +
        `Make sure the library is built and in the correct location.\n` +
        `Error: ${error}`,
    );
  }

  // Cast to typed exports
  const exports = library as unknown as NativeExports;

  // Validate library loaded correctly by calling version function
  try {
    const version = exports.primitives_version_string();
    console.log(`Loaded primitives library version: ${version}`);
  } catch (error) {
    throw new Error(`Failed to call native library functions. Library may be invalid.\nError: ${error}`);
  }

  return {
    library,
    exports,
  };
}

/**
 * Singleton native instance
 */
let nativeInstance: LoadedNative | null = null;

/**
 * Get or initialize native FFI instance
 *
 * @param config Optional configuration for first initialization
 * @returns Loaded native library
 */
export async function getNative(config?: NativeLoaderConfig): Promise<LoadedNative> {
  if (!nativeInstance) {
    nativeInstance = await loadNative(config || {});
  }
  return nativeInstance;
}

/**
 * Reset native instance (for testing)
 */
export function resetNative(): void {
  nativeInstance = null;
}

/**
 * Check if FFI is available in current environment
 */
export function isFFIAvailable(): boolean {
  try {
    // Check if we're in Node.js environment
    return typeof process !== 'undefined' && process.versions && process.versions.node !== undefined;
  } catch {
    return false;
  }
}

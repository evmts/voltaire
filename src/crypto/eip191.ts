/**
 * EIP-191: Signed Data Standard
 * Personal message signing format
 */

import { dlopen, FFIType, suffix, ptr } from "bun:ffi";
import { resolve } from "path";

// Load the C library (reuse from keccak)
const libPath = resolve(import.meta.dir, `../../zig-out/lib/libprimitives_c.${suffix}`);

const {
  symbols: { primitives_eip191_hash_message, primitives_hash_to_hex },
} = dlopen(libPath, {
  primitives_eip191_hash_message: {
    args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
    returns: FFIType.i32,
  },
  primitives_hash_to_hex: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
});

/**
 * Hash a message using EIP-191 personal message format
 * Format: "\x19Ethereum Signed Message:\n" + len(message) + message
 * @param message - Message to hash (string or Uint8Array)
 * @returns 32-byte hash as hex string with 0x prefix
 */
export function hashMessage(message: string | Uint8Array): string {
  // Convert string to bytes
  const bytes =
    typeof message === "string" ? new TextEncoder().encode(message) : message;

  // Allocate output buffer for 32-byte hash
  const hashBuffer = new Uint8Array(32);

  // Call C function
  const result = primitives_eip191_hash_message(
    ptr(bytes),
    bytes.length,
    ptr(hashBuffer)
  );

  if (result !== 0) {
    throw new Error(`EIP-191 hash failed with error code: ${result}`);
  }

  // Convert hash to hex string
  const hexBuffer = new Uint8Array(66); // "0x" + 64 hex chars
  const hexResult = primitives_hash_to_hex(ptr(hashBuffer), ptr(hexBuffer));

  if (hexResult !== 0) {
    throw new Error(
      `Hash to hex conversion failed with error code: ${hexResult}`
    );
  }

  // Convert buffer to string
  return new TextDecoder().decode(hexBuffer);
}

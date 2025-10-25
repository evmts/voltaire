/**
 * Uint256 utilities - Branded type with operations
 *
 * Provides a type-safe wrapper around 256-bit unsigned integers
 * represented as hex strings with validation and arithmetic operations.
 */

/**
 * Branded type for 256-bit unsigned integers
 * Represented as hex string with 0x prefix
 * Range: 0 to 2^256-1
 */
export type Uint256 = `0x${string}` & { __brand: 'Uint256' };

/**
 * Constants
 */
export const ZERO: Uint256 = '0x0' as Uint256;
export const ONE: Uint256 = '0x1' as Uint256;
export const MAX_UINT256: Uint256 =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as Uint256;

// Range boundaries
const MIN_UINT256 = 0n;
const MAX_UINT256_BIGINT = (1n << 256n) - 1n; // 2^256 - 1

/**
 * Convert bigint to Uint256 with range validation
 * @param value - BigInt value (must be 0 to 2^256-1)
 * @returns Uint256 hex string
 * @throws Error if value is out of range
 */
export function fromBigInt(value: bigint): Uint256 {
  if (value < MIN_UINT256) {
    throw new Error(`Value ${value} is below minimum Uint256 (0)`);
  }
  if (value > MAX_UINT256_BIGINT) {
    throw new Error(`Value ${value} exceeds maximum Uint256 (2^256-1)`);
  }

  // Convert to hex with 0x prefix
  return `0x${value.toString(16)}` as Uint256;
}

/**
 * Convert Uint256 to bigint
 * @param value - Uint256 hex string
 * @returns BigInt value
 */
export function toBigInt(value: Uint256): bigint {
  return BigInt(value);
}

/**
 * Convert hex string to Uint256 with validation
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Uint256 hex string
 * @throws Error if invalid hex or out of range
 */
export function fromHex(hex: string): Uint256 {
  // Ensure 0x prefix
  const normalized = hex.startsWith('0x') ? hex : `0x${hex}`;

  // Validate hex format
  if (!/^0x[0-9a-fA-F]+$/.test(normalized)) {
    throw new Error(`Invalid hex format: ${hex}`);
  }

  // Check if it's within range
  try {
    const bigIntValue = BigInt(normalized);
    if (bigIntValue < MIN_UINT256 || bigIntValue > MAX_UINT256_BIGINT) {
      throw new Error(`Value ${hex} is out of Uint256 range`);
    }
    return normalized as Uint256;
  } catch (error) {
    if (error instanceof Error && error.message.includes('out of Uint256 range')) {
      throw error;
    }
    throw new Error(`Invalid hex value: ${hex}`);
  }
}

/**
 * Convert Uint256 to hex string (already in hex format, returns as-is)
 * @param value - Uint256 hex string
 * @returns Hex string with 0x prefix
 */
export function toHex(value: Uint256): string {
  return value;
}

/**
 * Convert bytes to Uint256 (big-endian)
 * @param bytes - Byte array (up to 32 bytes, big-endian)
 * @returns Uint256 hex string
 * @throws Error if bytes length exceeds 32
 */
export function fromBytes(bytes: Uint8Array): Uint256 {
  if (bytes.length > 32) {
    throw new Error(`Byte array too large: ${bytes.length} bytes (max 32)`);
  }

  // Convert bytes to bigint (big-endian)
  let value = 0n;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8n) | BigInt(bytes[i]!);
  }

  return fromBigInt(value);
}

/**
 * Convert Uint256 to bytes (big-endian, 32 bytes)
 * @param value - Uint256 hex string
 * @returns 32-byte Uint8Array (big-endian, zero-padded)
 */
export function toBytes(value: Uint256): Uint8Array {
  const bigIntValue = toBigInt(value);

  // Create 32-byte array
  const bytes = new Uint8Array(32);

  // Fill bytes in big-endian order
  let remaining = bigIntValue;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }

  return bytes;
}

/**
 * Add two Uint256 values
 * @param a - First operand
 * @param b - Second operand
 * @returns Sum as Uint256
 * @throws Error if result overflows
 */
export function add(a: Uint256, b: Uint256): Uint256 {
  const result = toBigInt(a) + toBigInt(b);
  if (result > MAX_UINT256_BIGINT) {
    throw new Error(`Addition overflow: ${a} + ${b} exceeds Uint256 maximum`);
  }
  return fromBigInt(result);
}

/**
 * Subtract two Uint256 values
 * @param a - Minuend
 * @param b - Subtrahend
 * @returns Difference as Uint256
 * @throws Error if result underflows (negative)
 */
export function sub(a: Uint256, b: Uint256): Uint256 {
  const result = toBigInt(a) - toBigInt(b);
  if (result < MIN_UINT256) {
    throw new Error(`Subtraction underflow: ${a} - ${b} is negative`);
  }
  return fromBigInt(result);
}

/**
 * Multiply two Uint256 values
 * @param a - First factor
 * @param b - Second factor
 * @returns Product as Uint256
 * @throws Error if result overflows
 */
export function mul(a: Uint256, b: Uint256): Uint256 {
  const result = toBigInt(a) * toBigInt(b);
  if (result > MAX_UINT256_BIGINT) {
    throw new Error(`Multiplication overflow: ${a} * ${b} exceeds Uint256 maximum`);
  }
  return fromBigInt(result);
}

/**
 * Divide two Uint256 values (integer division)
 * @param a - Dividend
 * @param b - Divisor
 * @returns Quotient as Uint256
 * @throws Error if divisor is zero
 */
export function div(a: Uint256, b: Uint256): Uint256 {
  const divisor = toBigInt(b);
  if (divisor === 0n) {
    throw new Error('Division by zero');
  }
  const result = toBigInt(a) / divisor;
  return fromBigInt(result);
}

/**
 * Modulo operation on two Uint256 values
 * @param a - Dividend
 * @param b - Divisor
 * @returns Remainder as Uint256
 * @throws Error if divisor is zero
 */
export function mod(a: Uint256, b: Uint256): Uint256 {
  const divisor = toBigInt(b);
  if (divisor === 0n) {
    throw new Error('Modulo by zero');
  }
  const result = toBigInt(a) % divisor;
  return fromBigInt(result);
}

/**
 * Power operation (a^b mod 2^256)
 * @param base - Base value
 * @param exponent - Exponent value
 * @returns Result as Uint256
 * @throws Error if result overflows
 */
export function pow(base: Uint256, exponent: Uint256): Uint256 {
  const baseValue = toBigInt(base);
  const expValue = toBigInt(exponent);

  // Handle special cases
  if (expValue === 0n) return ONE;
  if (baseValue === 0n) return ZERO;
  if (baseValue === 1n) return ONE;

  // Calculate power
  let result = 1n;
  let b = baseValue;
  let e = expValue;

  while (e > 0n) {
    if (e & 1n) {
      result *= b;
      if (result > MAX_UINT256_BIGINT) {
        throw new Error(`Power overflow: ${base}^${exponent} exceeds Uint256 maximum`);
      }
    }
    e >>= 1n;
    if (e > 0n) {
      b *= b;
      if (b > MAX_UINT256_BIGINT) {
        throw new Error(`Power overflow: ${base}^${exponent} exceeds Uint256 maximum`);
      }
    }
  }

  return fromBigInt(result);
}

/**
 * Compare two Uint256 values
 * @param a - First value
 * @param b - Second value
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compare(a: Uint256, b: Uint256): -1 | 0 | 1 {
  const aBig = toBigInt(a);
  const bBig = toBigInt(b);

  if (aBig < bBig) return -1;
  if (aBig > bBig) return 1;
  return 0;
}

/**
 * Check if two Uint256 values are equal
 * @param a - First value
 * @param b - Second value
 * @returns true if equal, false otherwise
 */
export function eq(a: Uint256, b: Uint256): boolean {
  return toBigInt(a) === toBigInt(b);
}

/**
 * Check if first value is less than second
 * @param a - First value
 * @param b - Second value
 * @returns true if a < b
 */
export function lt(a: Uint256, b: Uint256): boolean {
  return toBigInt(a) < toBigInt(b);
}

/**
 * Check if first value is greater than second
 * @param a - First value
 * @param b - Second value
 * @returns true if a > b
 */
export function gt(a: Uint256, b: Uint256): boolean {
  return toBigInt(a) > toBigInt(b);
}

/**
 * Check if first value is less than or equal to second
 * @param a - First value
 * @param b - Second value
 * @returns true if a <= b
 */
export function lte(a: Uint256, b: Uint256): boolean {
  return toBigInt(a) <= toBigInt(b);
}

/**
 * Check if first value is greater than or equal to second
 * @param a - First value
 * @param b - Second value
 * @returns true if a >= b
 */
export function gte(a: Uint256, b: Uint256): boolean {
  return toBigInt(a) >= toBigInt(b);
}

/**
 * Get minimum of two Uint256 values
 * @param a - First value
 * @param b - Second value
 * @returns Minimum value
 */
export function min(a: Uint256, b: Uint256): Uint256 {
  return lt(a, b) ? a : b;
}

/**
 * Get maximum of two Uint256 values
 * @param a - First value
 * @param b - Second value
 * @returns Maximum value
 */
export function max(a: Uint256, b: Uint256): Uint256 {
  return gt(a, b) ? a : b;
}

/**
 * Bitwise AND operation
 * @param a - First operand
 * @param b - Second operand
 * @returns Result as Uint256
 */
export function and(a: Uint256, b: Uint256): Uint256 {
  const result = toBigInt(a) & toBigInt(b);
  return fromBigInt(result);
}

/**
 * Bitwise OR operation
 * @param a - First operand
 * @param b - Second operand
 * @returns Result as Uint256
 */
export function or(a: Uint256, b: Uint256): Uint256 {
  const result = toBigInt(a) | toBigInt(b);
  return fromBigInt(result);
}

/**
 * Bitwise XOR operation
 * @param a - First operand
 * @param b - Second operand
 * @returns Result as Uint256
 */
export function xor(a: Uint256, b: Uint256): Uint256 {
  const result = toBigInt(a) ^ toBigInt(b);
  return fromBigInt(result);
}

/**
 * Bitwise NOT operation
 * @param value - Operand
 * @returns Result as Uint256
 */
export function not(value: Uint256): Uint256 {
  const result = MAX_UINT256_BIGINT ^ toBigInt(value);
  return fromBigInt(result);
}

/**
 * Left shift operation
 * @param value - Value to shift
 * @param bits - Number of bits to shift (must be 0-255)
 * @returns Result as Uint256
 * @throws Error if result overflows or bits out of range
 */
export function shl(value: Uint256, bits: number): Uint256 {
  if (bits < 0 || bits > 255) {
    throw new Error(`Shift bits must be 0-255, got ${bits}`);
  }
  if (bits === 0) return value;

  const result = toBigInt(value) << BigInt(bits);
  if (result > MAX_UINT256_BIGINT) {
    throw new Error(`Left shift overflow: ${value} << ${bits} exceeds Uint256 maximum`);
  }
  return fromBigInt(result);
}

/**
 * Right shift operation
 * @param value - Value to shift
 * @param bits - Number of bits to shift (must be 0-255)
 * @returns Result as Uint256
 * @throws Error if bits out of range
 */
export function shr(value: Uint256, bits: number): Uint256 {
  if (bits < 0 || bits > 255) {
    throw new Error(`Shift bits must be 0-255, got ${bits}`);
  }
  if (bits === 0) return value;

  const result = toBigInt(value) >> BigInt(bits);
  return fromBigInt(result);
}

/**
 * Type guard to check if a value is a valid Uint256
 * @param value - Value to check
 * @returns true if value is a valid Uint256 hex string
 */
export function isUint256(value: unknown): value is Uint256 {
  if (typeof value !== 'string') return false;
  if (!value.startsWith('0x')) return false;

  // Check hex format
  if (!/^0x[0-9a-fA-F]+$/.test(value)) return false;

  try {
    const bigIntValue = BigInt(value);
    return bigIntValue >= MIN_UINT256 && bigIntValue <= MAX_UINT256_BIGINT;
  } catch {
    return false;
  }
}

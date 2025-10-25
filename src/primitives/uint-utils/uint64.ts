/**
 * Uint64 utilities - Branded type with operations
 *
 * Provides a type-safe wrapper around 64-bit unsigned integers
 * represented as hex strings with validation and arithmetic operations.
 */

/**
 * Branded type for 64-bit unsigned integers
 * Represented as hex string with 0x prefix
 * Range: 0 to 2^64-1 (0 to 18446744073709551615)
 */
export type Uint64 = `0x${string}` & { __brand: 'Uint64' };

/**
 * Constants
 */
export const UINT64_ZERO: Uint64 = '0x0' as Uint64;
export const UINT64_ONE: Uint64 = '0x1' as Uint64;
export const UINT64_MAX: Uint64 = '0xffffffffffffffff' as Uint64;

// Range boundaries
const MIN_UINT64 = 0n;
const MAX_UINT64 = (1n << 64n) - 1n; // 2^64 - 1

/**
 * Convert bigint to Uint64 with range validation
 * @param value - BigInt value (must be 0 to 2^64-1)
 * @returns Uint64 hex string
 * @throws Error if value is out of range
 */
export function fromBigInt(value: bigint): Uint64 {
  if (value < MIN_UINT64) {
    throw new Error(`Value ${value} is below minimum Uint64 (0)`);
  }
  if (value > MAX_UINT64) {
    throw new Error(`Value ${value} exceeds maximum Uint64 (2^64-1)`);
  }

  // Convert to hex with 0x prefix
  return `0x${value.toString(16)}` as Uint64;
}

/**
 * Convert Uint64 to bigint
 * @param value - Uint64 hex string
 * @returns BigInt value
 */
export function toBigInt(value: Uint64): bigint {
  return BigInt(value);
}

/**
 * Convert number to Uint64 with range validation
 * @param value - Number (must be safe integer between 0 and 2^64-1)
 * @returns Uint64 hex string
 * @throws Error if value is not a safe integer or out of range
 */
export function fromNumber(value: number): Uint64 {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`Value ${value} is not a safe integer`);
  }
  if (value < 0) {
    throw new Error(`Value ${value} is negative`);
  }
  // Numbers above Number.MAX_SAFE_INTEGER will be caught by isSafeInteger
  // But we also need to check against Uint64 max
  const bigIntValue = BigInt(value);
  if (bigIntValue > MAX_UINT64) {
    throw new Error(`Value ${value} exceeds maximum Uint64 (2^64-1)`);
  }

  return fromBigInt(bigIntValue);
}

/**
 * Convert Uint64 to number
 * @param value - Uint64 hex string
 * @returns Number value
 * @throws Error if value exceeds Number.MAX_SAFE_INTEGER
 */
export function toNumber(value: Uint64): number {
  const bigIntValue = toBigInt(value);

  // Check if value is within safe integer range
  if (bigIntValue > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      `Value ${value} exceeds Number.MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER})`
    );
  }

  return Number(bigIntValue);
}

/**
 * Add two Uint64 values
 * @param a - First operand
 * @param b - Second operand
 * @returns Sum as Uint64
 * @throws Error if result overflows
 */
export function add(a: Uint64, b: Uint64): Uint64 {
  const result = toBigInt(a) + toBigInt(b);
  if (result > MAX_UINT64) {
    throw new Error(`Addition overflow: ${a} + ${b} exceeds Uint64 maximum`);
  }
  return fromBigInt(result);
}

/**
 * Subtract two Uint64 values
 * @param a - Minuend
 * @param b - Subtrahend
 * @returns Difference as Uint64
 * @throws Error if result underflows (negative)
 */
export function sub(a: Uint64, b: Uint64): Uint64 {
  const result = toBigInt(a) - toBigInt(b);
  if (result < MIN_UINT64) {
    throw new Error(`Subtraction underflow: ${a} - ${b} is negative`);
  }
  return fromBigInt(result);
}

/**
 * Multiply two Uint64 values
 * @param a - First factor
 * @param b - Second factor
 * @returns Product as Uint64
 * @throws Error if result overflows
 */
export function mul(a: Uint64, b: Uint64): Uint64 {
  const result = toBigInt(a) * toBigInt(b);
  if (result > MAX_UINT64) {
    throw new Error(`Multiplication overflow: ${a} * ${b} exceeds Uint64 maximum`);
  }
  return fromBigInt(result);
}

/**
 * Divide two Uint64 values (integer division)
 * @param a - Dividend
 * @param b - Divisor
 * @returns Quotient as Uint64
 * @throws Error if divisor is zero
 */
export function div(a: Uint64, b: Uint64): Uint64 {
  const divisor = toBigInt(b);
  if (divisor === 0n) {
    throw new Error('Division by zero');
  }
  const result = toBigInt(a) / divisor;
  return fromBigInt(result);
}

/**
 * Modulo operation on two Uint64 values
 * @param a - Dividend
 * @param b - Divisor
 * @returns Remainder as Uint64
 * @throws Error if divisor is zero
 */
export function mod(a: Uint64, b: Uint64): Uint64 {
  const divisor = toBigInt(b);
  if (divisor === 0n) {
    throw new Error('Modulo by zero');
  }
  const result = toBigInt(a) % divisor;
  return fromBigInt(result);
}

/**
 * Compare two Uint64 values
 * @param a - First value
 * @param b - Second value
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compare(a: Uint64, b: Uint64): -1 | 0 | 1 {
  const aBig = toBigInt(a);
  const bBig = toBigInt(b);

  if (aBig < bBig) return -1;
  if (aBig > bBig) return 1;
  return 0;
}

/**
 * Check if two Uint64 values are equal
 * @param a - First value
 * @param b - Second value
 * @returns true if equal, false otherwise
 */
export function eq(a: Uint64, b: Uint64): boolean {
  return toBigInt(a) === toBigInt(b);
}

/**
 * Check if first value is less than second
 * @param a - First value
 * @param b - Second value
 * @returns true if a < b
 */
export function lt(a: Uint64, b: Uint64): boolean {
  return toBigInt(a) < toBigInt(b);
}

/**
 * Check if first value is greater than second
 * @param a - First value
 * @param b - Second value
 * @returns true if a > b
 */
export function gt(a: Uint64, b: Uint64): boolean {
  return toBigInt(a) > toBigInt(b);
}

/**
 * Check if first value is less than or equal to second
 * @param a - First value
 * @param b - Second value
 * @returns true if a <= b
 */
export function lte(a: Uint64, b: Uint64): boolean {
  return toBigInt(a) <= toBigInt(b);
}

/**
 * Check if first value is greater than or equal to second
 * @param a - First value
 * @param b - Second value
 * @returns true if a >= b
 */
export function gte(a: Uint64, b: Uint64): boolean {
  return toBigInt(a) >= toBigInt(b);
}

/**
 * Get minimum of two Uint64 values
 * @param a - First value
 * @param b - Second value
 * @returns Minimum value
 */
export function min(a: Uint64, b: Uint64): Uint64 {
  return lt(a, b) ? a : b;
}

/**
 * Get maximum of two Uint64 values
 * @param a - First value
 * @param b - Second value
 * @returns Maximum value
 */
export function max(a: Uint64, b: Uint64): Uint64 {
  return gt(a, b) ? a : b;
}

/**
 * Type guard to check if a value is a valid Uint64
 * @param value - Value to check
 * @returns true if value is a valid Uint64 hex string
 */
export function isUint64(value: unknown): value is Uint64 {
  if (typeof value !== 'string') return false;
  if (!value.startsWith('0x')) return false;

  // Check hex format
  if (!/^0x[0-9a-fA-F]+$/.test(value)) return false;

  try {
    const bigIntValue = BigInt(value);
    return bigIntValue >= MIN_UINT64 && bigIntValue <= MAX_UINT64;
  } catch {
    return false;
  }
}

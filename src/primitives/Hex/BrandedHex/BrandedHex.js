/**
 * @typedef {import('./HexType.ts').HexType} HexType
 * Branded Hex type (unsized)
 */

/**
 * @template {number} [TSize=number]
 * @typedef {import('./HexType.ts').Sized<TSize>} Sized
 * Sized Hex type with specific byte size
 * @example HexType.Sized<4> = '0x12345678' (4 bytes = 8 hex chars)
 */

/**
 * @template {number} N
 * @typedef {Sized<N>} Bytes
 * Hex string of exactly N bytes
 */

export {};

/**
 * @typedef {`0x${string}` & { readonly __tag: "Hex" }} BrandedHex
 * Branded Hex type (unsized)
 */

/**
 * @template {number} [TSize=number]
 * @typedef {`0x${string}` & { readonly __tag: "Hex"; readonly size: TSize }} Sized
 * Sized Hex type with specific byte size
 * @example BrandedHex.Sized<4> = '0x12345678' (4 bytes = 8 hex chars)
 */

/**
 * @template {number} N
 * @typedef {Sized<N>} Bytes
 * Hex string of exactly N bytes
 */

export {};

/**
 * Branded Hex type (unsized)
 */
export type HexType = import("./HexType.js").HexType;
/**
 * Sized Hex type with specific byte size
 */
export type Sized<TSize extends number = number> = import("./HexType.js").Sized<TSize>;
/**
 * Hex string of exactly N bytes
 */
export type Bytes<N extends number> = Sized<N>;
//# sourceMappingURL=BrandedHex.d.ts.map
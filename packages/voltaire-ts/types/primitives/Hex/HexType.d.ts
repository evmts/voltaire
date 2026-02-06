import type { brand } from "../../brand.js";
/**
 * Branded Hex type (unsized)
 */
export type HexType = `0x${string}` & {
    readonly [brand]: "Hex";
};
/**
 * Alias for HexType
 */
export type Hex = HexType;
/**
 * Sized Hex type with specific byte size
 * @example HexType.Sized<4> = '0x12345678' (4 bytes = 8 hex chars)
 */
export type Sized<TSize extends number = number> = `0x${string}` & {
    readonly [brand]: "Hex";
    readonly size: TSize;
};
/**
 * Hex string of exactly N bytes
 */
export type Bytes<N extends number> = Sized<N>;
//# sourceMappingURL=HexType.d.ts.map
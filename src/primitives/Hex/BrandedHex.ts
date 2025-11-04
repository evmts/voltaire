/**
 * Branded Hex type (unsized)
 */
export type BrandedHex = `0x${string}` & { readonly __tag: "Hex" };

/**
 * Sized Hex type with specific byte size
 * @example BrandedHex.Sized<4> = '0x12345678' (4 bytes = 8 hex chars)
 */
export type Sized<TSize extends number = number> = `0x${string}` & {
	readonly __tag: "Hex";
	readonly size: TSize;
};

/**
 * Hex string of exactly N bytes
 */
export type Bytes<N extends number> = Sized<N>;

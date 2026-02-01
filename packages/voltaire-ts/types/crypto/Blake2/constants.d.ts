/**
 * BLAKE2b constants
 *
 * Initialization vectors and message schedule as specified in RFC 7693.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7693
 */
/** BLAKE2b initialization vectors */
export const IV: bigint[];
/** BLAKE2b message schedule (sigma) - 12 rounds of permutations */
export const SIGMA: number[][];
/** 64-bit mask for BigInt operations */
export const MASK_64: bigint;
//# sourceMappingURL=constants.d.ts.map
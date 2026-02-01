/**
 * Compute square root in Fp (if it exists)
 * For BLS12-381, p = 3 mod 4, so we use Tonelli-Shanks simplification:
 * sqrt(a) = a^((p+1)/4) mod p
 *
 * @param {bigint} a - Value to take square root of
 * @returns {bigint | null} Square root if it exists, null otherwise
 */
export function sqrt(a: bigint): bigint | null;
//# sourceMappingURL=sqrt.d.ts.map
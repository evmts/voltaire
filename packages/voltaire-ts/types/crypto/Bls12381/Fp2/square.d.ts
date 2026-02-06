/**
 * Square an Fp2 element
 * (a0 + a1*i)^2 = (a0^2 - a1^2) + 2*a0*a1*i
 * Optimized: uses 2 muls instead of 3
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - Value to square
 * @returns {import('../Fp2Type.js').Fp2Type}
 */
export function square(a: import("../Fp2Type.js").Fp2Type): import("../Fp2Type.js").Fp2Type;
//# sourceMappingURL=square.d.ts.map
/**
 * Invert an Fp2 element
 * 1/(a0 + a1*i) = (a0 - a1*i) / (a0^2 + a1^2)
 * The denominator is in Fp since (a0 + a1*i)(a0 - a1*i) = a0^2 + a1^2
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - Value to invert
 * @returns {import('../Fp2Type.js').Fp2Type}
 * @throws {import('../errors.js').InvalidFieldElementError} If element is zero (norm = 0)
 */
export function inv(a: import("../Fp2Type.js").Fp2Type): import("../Fp2Type.js").Fp2Type;
//# sourceMappingURL=inv.d.ts.map
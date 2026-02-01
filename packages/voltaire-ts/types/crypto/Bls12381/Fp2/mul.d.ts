/**
 * Multiply two Fp2 elements
 * (a0 + a1*i) * (b0 + b1*i) = (a0*b0 - a1*b1) + (a0*b1 + a1*b0)*i
 * Using Karatsuba: 3 multiplications instead of 4
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - First operand
 * @param {import('../Fp2Type.js').Fp2Type} b - Second operand
 * @returns {import('../Fp2Type.js').Fp2Type}
 */
export function mul(a: import("../Fp2Type.js").Fp2Type, b: import("../Fp2Type.js").Fp2Type): import("../Fp2Type.js").Fp2Type;
//# sourceMappingURL=mul.d.ts.map
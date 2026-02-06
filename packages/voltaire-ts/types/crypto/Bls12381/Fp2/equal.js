/**
 * Check if two Fp2 elements are equal
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - First operand
 * @param {import('../Fp2Type.js').Fp2Type} b - Second operand
 * @returns {boolean}
 */
export function equal(a, b) {
    return a.c0 === b.c0 && a.c1 === b.c1;
}

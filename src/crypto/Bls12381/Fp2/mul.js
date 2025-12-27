import * as Fp from "../Fp/index.js";

/**
 * Multiply two Fp2 elements
 * (a0 + a1*i) * (b0 + b1*i) = (a0*b0 - a1*b1) + (a0*b1 + a1*b0)*i
 * Using Karatsuba: 3 multiplications instead of 4
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - First operand
 * @param {import('../Fp2Type.js').Fp2Type} b - Second operand
 * @returns {import('../Fp2Type.js').Fp2Type}
 */
export function mul(a, b) {
	const t0 = Fp.mul(a.c0, b.c0);
	const t1 = Fp.mul(a.c1, b.c1);
	// c0 = a0*b0 - a1*b1 (since i^2 = -1)
	const c0 = Fp.sub(t0, t1);
	// c1 = (a0 + a1)(b0 + b1) - a0*b0 - a1*b1 = a0*b1 + a1*b0
	const c1 = Fp.sub(
		Fp.sub(Fp.mul(Fp.add(a.c0, a.c1), Fp.add(b.c0, b.c1)), t0),
		t1,
	);
	return { c0, c1 };
}

import type { brand } from "../../brand.js";
/**
 * BLS12-381 Fp2 extension field element type
 *
 * Fp2 = Fp[i] / (i^2 + 1), where i^2 = -1
 * Elements are represented as c0 + c1*i where c0, c1 are in Fp
 *
 * @since 0.0.0
 */
export type Fp2Type = {
    /** Real component (c0) */
    c0: bigint;
    /** Imaginary component (c1) */
    c1: bigint;
    readonly [brand]?: "Bls12381Fp2";
};
//# sourceMappingURL=Fp2Type.d.ts.map
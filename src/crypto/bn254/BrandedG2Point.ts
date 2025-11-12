import type { brand } from "../../brand.js";
import type { Fp2 } from "./Fp2.js";

export type BrandedG2Point = {
	x: Fp2;
	y: Fp2;
	z: Fp2;
	readonly [brand]: "G2Point";
};

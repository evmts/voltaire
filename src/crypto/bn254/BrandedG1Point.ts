import type { brand } from "../../brand.js";

export type BrandedG1Point = {
	x: bigint;
	y: bigint;
	z: bigint;
	readonly [brand]: "G1Point";
};

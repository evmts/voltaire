import type { brand } from "../../../brand.js";

export type BrandedEns = string & {
	readonly [brand]: "Ens";
};

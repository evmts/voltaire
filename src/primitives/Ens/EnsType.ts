import type { brand } from "../../brand.js";

export type EnsType = string & {
	readonly [brand]: "Ens";
};

import type { Chain } from "./ChainType.js";

/**
 * Chain constructor type
 */
export interface ChainConstructor {
	(chain: Chain): Chain;
	from: (chain: Chain) => Chain;
	fromId: (id: number) => Chain | undefined;
	byId: Record<number, Chain>;
}

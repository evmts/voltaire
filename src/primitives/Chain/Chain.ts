export type { Chain, NativeCurrency, Explorer } from "@tevm/chains";
export { getChainById, chainById, allChains } from "@tevm/chains";
export * from "@tevm/chains";

import type { Chain as ChainType } from "@tevm/chains";
import { chainById, getChainById } from "@tevm/chains";

/**
 * Chain namespace
 */
export namespace Chain {
	export const from = (chain: ChainType): ChainType => chain;
	export const fromId = (id: number): ChainType | undefined => getChainById(id);
	export const byId = chainById;
}

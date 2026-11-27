import type { Chain } from "./ChainType.js";
import type { Hardfork } from "./metadata.js";

/**
 * Chain constructor type
 */
export interface ChainConstructor {
	(chain: Chain): Chain;
	from: (chain: Chain) => Chain;
	fromId: (id: number) => Chain | undefined;
	byId: Record<number, Chain>;
	getName: (chain: Chain) => string;
	getShortName: (chain: Chain) => string;
	getSymbol: (chain: Chain) => string;
	getRpcUrl: (chain: Chain) => string | string[];
	getExplorerUrl: (chain: Chain) => string | undefined;
	getWebsocketUrl: (chain: Chain) => string | string[] | undefined;
	isTestnet: (chain: Chain) => boolean;
	isL2: (chain: Chain) => boolean;
	getL1Chain: (chain: Chain) => Chain | undefined;
	getLatestHardfork: (chain: Chain) => Hardfork;
	getHardforkBlock: (chain: Chain, hardfork: Hardfork) => number | undefined;
	supportsHardfork: (chain: Chain, hardfork: Hardfork) => boolean;
	getBlockTime: (chain: Chain) => number;
	getGasLimit: (chain: Chain) => number;
}

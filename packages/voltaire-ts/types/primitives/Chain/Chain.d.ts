/**
 * @typedef {import('./ChainType.js').Chain} Chain
 * @typedef {import('./ChainConstructor.js').ChainConstructor} ChainConstructor
 */
/**
 * Factory function for creating Chain instances
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @type {ChainConstructor}
 * @throws {never}
 * @example
 * ```javascript
 * import { mainnet } from '@tevm/chains';
 * import * as Chain from './primitives/Chain/index.js';
 * const chain = Chain.Chain(mainnet);
 * ```
 */
export function Chain(chain: any): import("@tevm/chains").Chain;
export type Chain = import("./ChainType.js").Chain;
export namespace Chain {
    export function from(chain: import("@tevm/chains").Chain): import("@tevm/chains").Chain;
    export function fromId(id: number): import("@tevm/chains").Chain | undefined;
    export { byId };
    export { getName };
    export { getShortName };
    export { getSymbol };
    export { getRpcUrl };
    export { getExplorerUrl };
    export { getWebsocketUrl };
    export { isTestnet };
    export { isL2 };
    export { getL1Chain };
    export { getLatestHardfork };
    export { getHardforkBlock };
    export { supportsHardfork };
    export { getBlockTime };
    export { getGasLimit };
}
export type ChainConstructor = import("./ChainConstructor.js").ChainConstructor;
import { byId } from "./byId.js";
import { getName } from "./getName.js";
import { getShortName } from "./getShortName.js";
import { getSymbol } from "./getSymbol.js";
import { getRpcUrl } from "./getRpcUrl.js";
import { getExplorerUrl } from "./getExplorerUrl.js";
import { getWebsocketUrl } from "./getWebsocketUrl.js";
import { isTestnet } from "./isTestnet.js";
import { isL2 } from "./isL2.js";
import { getL1Chain } from "./getL1Chain.js";
import { getLatestHardfork } from "./getLatestHardfork.js";
import { getHardforkBlock } from "./getHardforkBlock.js";
import { supportsHardfork } from "./supportsHardfork.js";
import { getBlockTime } from "./getBlockTime.js";
import { getGasLimit } from "./getGasLimit.js";
export { CHAIN_METADATA, DEFAULT_METADATA } from "./metadata.js";
//# sourceMappingURL=Chain.d.ts.map
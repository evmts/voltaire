import { chainById as tevmChainById } from "@tevm/chains";

/**
 * Record mapping chain IDs to chain objects
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @type {Record<number, import('../ChainType.js').Chain>}
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const mainnet = Chain.byId[1];
 * const optimism = Chain.byId[10];
 * ```
 */
export const byId = tevmChainById;

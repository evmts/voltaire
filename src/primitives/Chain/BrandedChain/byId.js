import { chainById as tevmChainById } from "@tevm/chains";

/**
 * Record mapping chain IDs to chain objects
 *
 * @type {Record<number, import('../ChainType.js').Chain>}
 *
 * @example
 * ```typescript
 * const mainnet = Chain.byId[1];
 * const optimism = Chain.byId[10];
 * ```
 */
export const byId = tevmChainById;

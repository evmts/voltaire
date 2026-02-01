/**
 * ERC-1967 Proxy Storage Slots and ERC-1167 Minimal Proxy utilities
 * @module Proxy
 * @see https://eips.ethereum.org/EIPS/eip-1967 - Proxy Storage Slots
 * @see https://eips.ethereum.org/EIPS/eip-1167 - Minimal Proxy Contract
 * @see https://eips.ethereum.org/EIPS/eip-3448 - MetaProxy Standard
 */

export * from "./constants.js";
export { generateErc1167 } from "./generateErc1167.js";
export { generateErc3448 } from "./generateErc3448.js";
export { isErc1167 } from "./isErc1167.js";
export { isErc3448 } from "./isErc3448.js";
export type { ProxySlotType } from "./ProxyType.js";
export { parseErc1167 } from "./parseErc1167.js";
export { parseErc3448 } from "./parseErc3448.js";

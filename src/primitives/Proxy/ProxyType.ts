import type { brand } from "../../brand.js";

/**
 * ERC-1967 Proxy storage slot type
 * Represents a 32-byte storage slot used in proxy contracts
 * @see https://eips.ethereum.org/EIPS/eip-1967
 */
export type ProxySlotType = Uint8Array & {
	readonly [brand]: "ProxySlot";
};

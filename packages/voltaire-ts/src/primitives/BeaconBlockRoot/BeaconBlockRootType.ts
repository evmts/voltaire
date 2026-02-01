import type { brand } from "../../brand.js";

/**
 * BeaconBlockRoot type
 *
 * Represents a 32-byte beacon chain block root hash (EIP-4788).
 * Available in the EVM via BLOCKHASH opcode for recent slots.
 *
 * @see https://voltaire.tevm.sh/primitives/beacon-block-root for BeaconBlockRoot documentation
 * @see https://eips.ethereum.org/EIPS/eip-4788 for EIP-4788 specification
 * @since 0.0.0
 */
export type BeaconBlockRootType = Uint8Array & {
	readonly [brand]: "BeaconBlockRoot";
	length: 32;
};

export const SIZE = 32;

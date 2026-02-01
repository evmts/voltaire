import type { SelectorType } from "../../Selector/SelectorType.js";

/**
 * ERC-165 Interface ID type
 *
 * An interface ID is a 4-byte identifier calculated by XORing all function selectors in an interface.
 * Same underlying type as Selector (4-byte Uint8Array).
 *
 * @see https://eips.ethereum.org/EIPS/eip-165 for ERC-165 specification
 * @since 0.0.0
 */
export type InterfaceIdType = SelectorType;

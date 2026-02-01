import * as Selector from "../../Selector/index.js";
/**
 * ERC-165 supportsInterface(bytes4) interface ID
 * @type {import('./InterfaceIdType.js').InterfaceIdType}
 * @see https://eips.ethereum.org/EIPS/eip-165
 */
export const ERC165_INTERFACE_ID = Selector.fromHex("0x01ffc9a7");
/**
 * ERC-20 Token Standard interface ID
 * @type {import('./InterfaceIdType.js').InterfaceIdType}
 * @see https://eips.ethereum.org/EIPS/eip-20
 */
export const ERC20_INTERFACE_ID = Selector.fromHex("0x36372b07");
/**
 * ERC-721 Non-Fungible Token Standard interface ID
 * @type {import('./InterfaceIdType.js').InterfaceIdType}
 * @see https://eips.ethereum.org/EIPS/eip-721
 */
export const ERC721_INTERFACE_ID = Selector.fromHex("0x80ac58cd");
/**
 * ERC-1155 Multi Token Standard interface ID
 * @type {import('./InterfaceIdType.js').InterfaceIdType}
 * @see https://eips.ethereum.org/EIPS/eip-1155
 */
export const ERC1155_INTERFACE_ID = Selector.fromHex("0xd9b67a26");

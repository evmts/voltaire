/**
 * Calculate ERC-165 interface ID from function selectors
 *
 * Interface ID is computed by XORing all function selectors in the interface.
 * Per ERC-165 specification.
 *
 * @param {Array<import('../../Selector/SelectorType.js').SelectorLike>} selectors - Array of function selectors
 * @returns {import('./InterfaceIdType.js').InterfaceIdType} Interface ID (4-byte XOR result)
 * @throws {AbiParameterMismatchError} If no selectors provided
 * @see https://eips.ethereum.org/EIPS/eip-165
 * @example
 * ```javascript
 * import * as Interface from './primitives/Abi/interface/index.js';
 *
 * // ERC-20 interface
 * const erc20 = Interface.getInterfaceId([
 *   '0x70a08231', // balanceOf(address)
 *   '0x095ea7b3', // approve(address,uint256)
 *   '0xa9059cbb', // transfer(address,uint256)
 *   '0xdd62ed3e', // allowance(address,address)
 *   '0x23b872dd', // transferFrom(address,address,uint256)
 *   '0x18160ddd', // totalSupply()
 * ]);
 * // Returns ERC20_INTERFACE_ID: 0x36372b07
 * ```
 */
export function getInterfaceId(selectors: Array<import("../../Selector/SelectorType.js").SelectorLike>): import("./InterfaceIdType.js").InterfaceIdType;
//# sourceMappingURL=getInterfaceId.d.ts.map
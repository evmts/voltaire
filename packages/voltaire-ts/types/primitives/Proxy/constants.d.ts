/**
 * ERC-1967 Implementation Slot
 * Storage slot for the implementation address in proxy contracts
 * Calculated as: bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
 * @see https://eips.ethereum.org/EIPS/eip-1967
 * @type {string}
 */
export const IMPLEMENTATION_SLOT: string;
/**
 * ERC-1967 Beacon Slot
 * Storage slot for the beacon address in beacon proxy contracts
 * Calculated as: bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)
 * @see https://eips.ethereum.org/EIPS/eip-1967
 * @type {string}
 */
export const BEACON_SLOT: string;
/**
 * ERC-1967 Admin Slot
 * Storage slot for the admin address in proxy contracts
 * Calculated as: bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
 * @see https://eips.ethereum.org/EIPS/eip-1967
 * @type {string}
 */
export const ADMIN_SLOT: string;
/**
 * ERC-1967 Rollback Test Slot
 * Storage slot used for rollback tests in upgradeable proxies
 * Calculated as: bytes32(uint256(keccak256('eip1967.proxy.rollback')) - 1)
 * @see https://eips.ethereum.org/EIPS/eip-1967
 * @type {string}
 */
export const ROLLBACK_SLOT: string;
//# sourceMappingURL=constants.d.ts.map
/**
 * ERC-1967 Implementation Slot
 * Storage slot for the implementation address in proxy contracts
 * Calculated as: bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
 * @see https://eips.ethereum.org/EIPS/eip-1967
 * @type {string}
 */
export const IMPLEMENTATION_SLOT =
	"0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

/**
 * ERC-1967 Beacon Slot
 * Storage slot for the beacon address in beacon proxy contracts
 * Calculated as: bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)
 * @see https://eips.ethereum.org/EIPS/eip-1967
 * @type {string}
 */
export const BEACON_SLOT =
	"0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";

/**
 * ERC-1967 Admin Slot
 * Storage slot for the admin address in proxy contracts
 * Calculated as: bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
 * @see https://eips.ethereum.org/EIPS/eip-1967
 * @type {string}
 */
export const ADMIN_SLOT =
	"0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

/**
 * ERC-1967 Rollback Test Slot
 * Storage slot used for rollback tests in upgradeable proxies
 * Calculated as: bytes32(uint256(keccak256('eip1967.proxy.rollback')) - 1)
 * @see https://eips.ethereum.org/EIPS/eip-1967
 * @type {string}
 */
export const ROLLBACK_SLOT =
	"0x4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd9143";

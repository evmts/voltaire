import { toHex } from "./toHex.js";

/**
 * Factory: Check if an address is a contract (has deployed bytecode)
 *
 * @param {Object} deps - Provider dependencies
 * @param {(address: string) => Promise<string>} deps.getCode - eth_getCode RPC call. Takes checksummed/lowercase hex address, returns hex bytecode or "0x"
 * @returns {(address: import('./AddressType.js').AddressType) => Promise<boolean>} Async function that returns true if address has code
 *
 * @example
 * ```typescript
 * import { IsContract } from '@tevm/voltaire/Address'
 * import { createPublicClient, http } from 'viem'
 *
 * const client = createPublicClient({ transport: http() })
 * const isContract = IsContract({
 *   getCode: (addr) => client.getCode({ address: addr })
 * })
 *
 * const result = await isContract(address)
 * // true if contract, false if EOA
 * ```
 *
 * @example
 * ```typescript
 * // Using with ethers.js
 * import { IsContract } from '@tevm/voltaire/Address'
 * import { ethers } from 'ethers'
 *
 * const provider = new ethers.JsonRpcProvider('https://...')
 * const isContract = IsContract({
 *   getCode: (addr) => provider.getCode(addr)
 * })
 * ```
 */
export function IsContract({ getCode }) {
	/**
	 * Check if address has deployed bytecode
	 * @param {import('./AddressType.js').AddressType} address - Address to check
	 * @returns {Promise<boolean>} True if address has code (is a contract)
	 */
	return async function isContract(address) {
		const hexAddress = toHex(address);
		const code = await getCode(hexAddress);
		// Contract if code exists and is more than "0x"
		return code !== null && code !== undefined && code !== "0x" && code.length > 2;
	};
}

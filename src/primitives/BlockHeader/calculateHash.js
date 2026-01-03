import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { toRlp } from "./toRlp.js";

/**
 * Factory: Calculate block hash (keccak256 of RLP-encoded header)
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(header: import('./BlockHeaderType.js').BlockHeaderType) => import('../BlockHash/BlockHashType.js').BlockHashType} Function that calculates block hash
 *
 * @see https://voltaire.tevm.sh/primitives/block-header for BlockHeader documentation
 * @since 0.1.42
 * @throws {never}
 *
 * Block hash is calculated as: keccak256(RLP(header))
 * Works for both PoW (pre-merge) and PoS (post-merge) blocks.
 * For PoS blocks, difficulty=0 and nonce=0x0000000000000000.
 *
 * @example
 * ```javascript
 * import { CalculateHash } from './primitives/BlockHeader/calculateHash.js';
 * import { hash as keccak256 } from '../../crypto/Keccak256/hash.js';
 * const calculateHash = CalculateHash({ keccak256 });
 * const blockHash = calculateHash(blockHeader);
 * ```
 */
export function CalculateHash({ keccak256 }) {
	/**
	 * @param {import('./BlockHeaderType.js').BlockHeaderType} header
	 * @returns {import('../BlockHash/BlockHashType.js').BlockHashType}
	 */
	return function calculateHash(header) {
		const rlpEncoded = toRlp(header);
		return /** @type {import('../BlockHash/BlockHashType.js').BlockHashType} */ (
			keccak256(rlpEncoded)
		);
	};
}

/**
 * Calculate block hash (keccak256 of RLP-encoded header)
 *
 * Default export with crypto injected.
 *
 * @param {import('./BlockHeaderType.js').BlockHeaderType} header - Block header
 * @returns {import('../BlockHash/BlockHashType.js').BlockHashType} Block hash (32 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/block-header for BlockHeader documentation
 * @since 0.1.42
 * @throws {never}
 *
 * @example
 * ```javascript
 * import { calculateHash } from './primitives/BlockHeader/calculateHash.js';
 * const blockHash = calculateHash(blockHeader);
 * ```
 */
export const calculateHash = CalculateHash({ keccak256 });

import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { fromBytes as blockHashFromBytes } from "../BlockHash/fromBytes.js";
import { fromBigInt as bytesFromBigInt } from "../Bytes/fromBigInt.js";
import { encode as rlpEncode } from "../Rlp/encode.js";

/**
 * Calculate the block hash for a block header (keccak256 of RLP-encoded header)
 *
 * Supports all Ethereum hardforks:
 * - Legacy (pre-London): 15 fields
 * - EIP-1559 (London): + baseFeePerGas
 * - EIP-4895 (Shanghai): + withdrawalsRoot
 * - EIP-4844 (Cancun): + blobGasUsed, excessBlobGas, parentBeaconBlockRoot
 *
 * @see https://voltaire.tevm.sh/primitives/block-header for BlockHeader documentation
 * @see https://ethereum.org/en/developers/docs/blocks/ for block documentation
 * @since 0.1.42
 * @param {import('./BlockHeaderType.js').BlockHeaderType} header - Block header to hash
 * @returns {import('../BlockHash/BlockHashType.js').BlockHashType} 32-byte block hash
 * @throws {never}
 * @example
 * ```javascript
 * import * as BlockHeader from './primitives/BlockHeader/index.js';
 *
 * const header = BlockHeader.from({
 *   parentHash: "0x...",
 *   // ... other fields
 * });
 *
 * const hash = BlockHeader.calculateHash(header);
 * // => Uint8Array (32 bytes)
 * ```
 */
export function calculateHash(header) {
	// Build RLP list of header fields in canonical order
	const fields = [
		// 1. parentHash (32 bytes)
		header.parentHash,
		// 2. ommersHash (32 bytes)
		header.ommersHash,
		// 3. beneficiary (20 bytes)
		header.beneficiary,
		// 4. stateRoot (32 bytes)
		header.stateRoot,
		// 5. transactionsRoot (32 bytes)
		header.transactionsRoot,
		// 6. receiptsRoot (32 bytes)
		header.receiptsRoot,
		// 7. logsBloom (256 bytes)
		header.logsBloom,
		// 8. difficulty (u256, without leading zeros)
		bigintToMinimalBytes(header.difficulty),
		// 9. number (u64, without leading zeros)
		bigintToMinimalBytes(header.number),
		// 10. gasLimit (u64, without leading zeros)
		bigintToMinimalBytes(header.gasLimit),
		// 11. gasUsed (u64, without leading zeros)
		bigintToMinimalBytes(header.gasUsed),
		// 12. timestamp (u64, without leading zeros)
		bigintToMinimalBytes(header.timestamp),
		// 13. extraData (variable)
		header.extraData,
		// 14. mixHash (32 bytes)
		header.mixHash,
		// 15. nonce (8 bytes)
		header.nonce,
	];

	// Optional EIP-1559 field (baseFeePerGas)
	if (header.baseFeePerGas !== undefined) {
		fields.push(bigintToMinimalBytes(header.baseFeePerGas));

		// Optional EIP-4895 field (withdrawalsRoot)
		if (header.withdrawalsRoot !== undefined) {
			fields.push(header.withdrawalsRoot);

			// Optional EIP-4844 fields
			if (header.blobGasUsed !== undefined) {
				fields.push(bigintToMinimalBytes(header.blobGasUsed));

				if (header.excessBlobGas !== undefined) {
					fields.push(bigintToMinimalBytes(header.excessBlobGas));

					if (header.parentBeaconBlockRoot !== undefined) {
						fields.push(header.parentBeaconBlockRoot);
					}
				}
			}
		}
	}

	// RLP encode the list
	const rlpEncoded = rlpEncode(fields);

	// Keccak256 hash and convert to BlockHash
	return blockHashFromBytes(keccak256(rlpEncoded));
}

/**
 * Convert bigint to minimal bytes (no leading zeros)
 * For RLP encoding, 0 should be encoded as empty bytes
 * @param {bigint} value
 * @returns {Uint8Array}
 */
function bigintToMinimalBytes(value) {
	if (value === 0n) {
		return new Uint8Array(0);
	}
	return bytesFromBigInt(value);
}

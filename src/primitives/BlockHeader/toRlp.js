import { encode } from "../Rlp/encode.js";
import { encodeBigintCompact } from "../Transaction/utils.js";

/**
 * Serialize BlockHeader to RLP-encoded bytes
 *
 * @see https://voltaire.tevm.sh/primitives/block-header for BlockHeader documentation
 * @since 0.1.42
 * @param {import('./BlockHeaderType.js').BlockHeaderType} header - Block header to encode
 * @returns {Uint8Array} RLP-encoded block header
 * @throws {never}
 *
 * RLP encoding order (Ethereum Yellow Paper):
 * 1. parentHash (32 bytes)
 * 2. ommersHash (32 bytes)
 * 3. beneficiary (20 bytes)
 * 4. stateRoot (32 bytes)
 * 5. transactionsRoot (32 bytes)
 * 6. receiptsRoot (32 bytes)
 * 7. logsBloom (256 bytes)
 * 8. difficulty (bigint, compact)
 * 9. number (bigint, compact)
 * 10. gasLimit (bigint, compact)
 * 11. gasUsed (bigint, compact)
 * 12. timestamp (bigint, compact)
 * 13. extraData (bytes)
 * 14. mixHash (32 bytes)
 * 15. nonce (8 bytes)
 * 16. baseFeePerGas (optional, EIP-1559)
 * 17. withdrawalsRoot (optional, Shanghai)
 * 18. blobGasUsed (optional, Cancun)
 * 19. excessBlobGas (optional, Cancun)
 * 20. parentBeaconBlockRoot (optional, Cancun)
 *
 * @example
 * ```javascript
 * import { toRlp } from './primitives/BlockHeader/toRlp.js';
 * const rlpBytes = toRlp(blockHeader);
 * ```
 */
export function toRlp(header) {
	/** @type {(Uint8Array)[]} */
	const fields = [
		header.parentHash,
		header.ommersHash,
		header.beneficiary,
		header.stateRoot,
		header.transactionsRoot,
		header.receiptsRoot,
		header.logsBloom,
		encodeBigintCompact(header.difficulty),
		encodeBigintCompact(header.number),
		encodeBigintCompact(header.gasLimit),
		encodeBigintCompact(header.gasUsed),
		encodeBigintCompact(header.timestamp),
		header.extraData,
		header.mixHash,
		header.nonce,
	];

	// Add optional fields in order (must be contiguous from first defined)
	if (header.baseFeePerGas !== undefined) {
		fields.push(encodeBigintCompact(header.baseFeePerGas));
	}
	if (header.withdrawalsRoot !== undefined) {
		fields.push(header.withdrawalsRoot);
	}
	if (header.blobGasUsed !== undefined) {
		fields.push(encodeBigintCompact(header.blobGasUsed));
	}
	if (header.excessBlobGas !== undefined) {
		fields.push(encodeBigintCompact(header.excessBlobGas));
	}
	if (header.parentBeaconBlockRoot !== undefined) {
		fields.push(header.parentBeaconBlockRoot);
	}

	return encode(fields);
}

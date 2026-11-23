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
 * - EIP-7685 (Prague and Osaka): + requestsHash
 * - EIP-7928 (Amsterdam): + blockAccessListHash
 *
 * Fork fields form an ordered suffix, and the three Cancun fields must appear together.
 *
 * @see https://voltaire.tevm.sh/primitives/block-header for BlockHeader documentation
 * @see https://ethereum.org/en/developers/docs/blocks/ for block documentation
 * @since 0.1.42
 * @param {import('./BlockHeaderType.js').BlockHeaderType} header - Block header to hash
 * @returns {import('../BlockHash/BlockHashType.js').BlockHashType} 32-byte block hash
 * @throws {Error} If a required fork field is missing
 * @example
 * ```javascript
 * import { BlockHeader } from "@tevm/voltaire";
 *
 * const zeroHash = `0x${"00".repeat(32)}`;
 * const header = BlockHeader.from({
 *   parentHash: zeroHash,
 *   ommersHash: zeroHash,
 *   beneficiary: `0x${"00".repeat(20)}`,
 *   stateRoot: zeroHash,
 *   transactionsRoot: zeroHash,
 *   receiptsRoot: zeroHash,
 *   logsBloom: new Uint8Array(256),
 *   difficulty: 0n,
 *   number: 1n,
 *   gasLimit: 30000000n,
 *   gasUsed: 0n,
 *   timestamp: 1764798551n,
 *   extraData: new Uint8Array(0),
 *   mixHash: zeroHash,
 *   nonce: new Uint8Array(8),
 *   baseFeePerGas: 7n,
 *   withdrawalsRoot: zeroHash,
 *   blobGasUsed: 0n,
 *   excessBlobGas: 0n,
 *   parentBeaconBlockRoot: zeroHash,
 *   requestsHash: "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
 * });
 * const hash = BlockHeader.calculateHash(header);
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

	const forkFields = /** @type {const} */ ([
		"baseFeePerGas",
		"withdrawalsRoot",
		"blobGasUsed",
		"excessBlobGas",
		"parentBeaconBlockRoot",
		"requestsHash",
		"blockAccessListHash",
	]);
	let missingField;
	for (const field of forkFields) {
		const value = header[field];
		if (value == null) {
			missingField ??= field;
			continue;
		}
		if (missingField !== undefined) {
			throw new Error(`Block header field ${field} requires ${missingField}`);
		}
		fields.push(
			typeof value === "bigint" ? bigintToMinimalBytes(value) : value,
		);
	}
	if (header.blobGasUsed != null && header.parentBeaconBlockRoot == null) {
		throw new Error(`Incomplete Cancun block header, missing ${missingField}`);
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

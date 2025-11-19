// @ts-nocheck

/**
 * @typedef {import('./BuilderBidType.js').BuilderBidType} BuilderBidType
 */

/**
 * Verifies the builder's BLS signature on the bid
 *
 * @param {BuilderBidType} bid - BuilderBid instance
 * @param {object} crypto - Crypto dependencies
 * @param {(pubkey: Uint8Array, message: Uint8Array, signature: Uint8Array) => boolean} crypto.blsVerify - BLS verification function
 * @returns {boolean} True if signature is valid
 * @example
 * ```typescript
 * import * as BuilderBid from './BuilderBid/index.js';
 * import { blsVerify } from './crypto/bls.js';
 * const valid = BuilderBid.verify(bid, { blsVerify });
 * console.log(`Signature valid: ${valid}`);
 * ```
 */
export function verify(bid, crypto) {
	if (!crypto?.blsVerify) {
		throw new Error("blsVerify not provided");
	}

	// Construct signing message from bid fields
	// In PBS, the message is typically SSZ-serialized bid data
	// This is a simplified version - production would use proper SSZ
	const message = new Uint8Array(
		8 + // slot (8 bytes)
			32 + // parentHash
			32 + // blockHash
			20 + // proposerFeeRecipient
			32 + // gasLimit (as 32 bytes)
			32 + // gasUsed (as 32 bytes)
			32, // value (as 32 bytes)
	);

	let offset = 0;

	// slot (little-endian 8 bytes)
	const slotBytes = new Uint8Array(8);
	let s = bid.slot;
	for (let i = 0; i < 8; i++) {
		slotBytes[i] = Number(s & 0xffn);
		s >>= 8n;
	}
	message.set(slotBytes, offset);
	offset += 8;

	// parentHash
	message.set(bid.parentHash, offset);
	offset += 32;

	// blockHash
	message.set(bid.blockHash, offset);
	offset += 32;

	// proposerFeeRecipient
	message.set(bid.proposerFeeRecipient, offset);
	offset += 20;

	// gasLimit (big-endian 32 bytes)
	const gasLimitBytes = new Uint8Array(32);
	let gl = bid.gasLimit;
	for (let i = 31; i >= 0; i--) {
		gasLimitBytes[i] = Number(gl & 0xffn);
		gl >>= 8n;
	}
	message.set(gasLimitBytes, offset);
	offset += 32;

	// gasUsed (big-endian 32 bytes)
	const gasUsedBytes = new Uint8Array(32);
	let gu = bid.gasUsed;
	for (let i = 31; i >= 0; i--) {
		gasUsedBytes[i] = Number(gu & 0xffn);
		gu >>= 8n;
	}
	message.set(gasUsedBytes, offset);
	offset += 32;

	// value (big-endian 32 bytes)
	const valueBytes = new Uint8Array(32);
	let v = bid.value;
	for (let i = 31; i >= 0; i--) {
		valueBytes[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	message.set(valueBytes, offset);

	return crypto.blsVerify(bid.builderPubkey, message, bid.signature);
}

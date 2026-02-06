// @ts-nocheck
/**
 * @typedef {import('./BuilderBidType.js').BuilderBidType} BuilderBidType
 * @typedef {import('./BuilderBidType.js').BuilderBidHex} BuilderBidHex
 */
/**
 * Converts Uint8Array to hex string
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToHex(bytes) {
    let hex = "0x";
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
}
/**
 * Converts BuilderBid to hex representation (RPC format)
 *
 * @param {BuilderBidType} bid - BuilderBid instance
 * @returns {BuilderBidHex} BuilderBid with hex strings
 * @example
 * ```typescript
 * import * as BuilderBid from './BuilderBid/index.js';
 * const hexBid = BuilderBid.toHex(bid);
 * ```
 */
export function toHex(bid) {
    return {
        slot: `0x${bid.slot.toString(16)}`,
        parent_hash: bytesToHex(bid.parentHash),
        block_hash: bytesToHex(bid.blockHash),
        builder_pubkey: bytesToHex(bid.builderPubkey),
        proposer_pubkey: bytesToHex(bid.proposerPubkey),
        proposer_fee_recipient: bytesToHex(bid.proposerFeeRecipient),
        gas_limit: `0x${bid.gasLimit.toString(16)}`,
        gas_used: `0x${bid.gasUsed.toString(16)}`,
        value: `0x${bid.value.toString(16)}`,
        signature: bytesToHex(bid.signature),
    };
}

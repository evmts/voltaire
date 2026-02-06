import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { deserialize as _deserialize } from "./deserialize.js";
import { format as _format_internal } from "./format.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";
import { getAccessList as _getAccessList_internal } from "./getAccessList.js";
import { getChainId as _getChainId_internal } from "./getChainId.js";
import { getGasPrice as _getGasPrice_internal } from "./getGasPrice.js";
import { getSender as _getSender_internal } from "./getSender.js";
import { getSigningHash as _getSigningHash_internal } from "./getSigningHash.js";
import { hasAccessList as _hasAccessList_internal } from "./hasAccessList.js";
import { hash as _hash_internal } from "./hash.js";
import { isSigned as _isSigned_internal } from "./isSigned.js";
import { serialize as _serialize_internal } from "./serialize.js";
import { toRpc as _toRpc } from "./toRpc.js";
import { detectType as _detectType } from "./typeGuards.js";
import { Type } from "./types.js";
import { verifySignature as _verifySignature_internal } from "./verifySignature.js";
export const TransactionBrand = Brand.nominal();
// Minimal structural check: object with numeric type matching Type enum
const isTransactionLike = (v) => typeof v === "object" &&
    v !== null &&
    // biome-ignore lint/suspicious/noExplicitAny: unknown type property access
    typeof v.type === "number" &&
    // biome-ignore lint/suspicious/noExplicitAny: unknown type property access
    v.type in Type;
export class TransactionSchema extends Schema.Class("Transaction")({
    value: Schema.Unknown.pipe(Schema.filter(isTransactionLike, {
        message: () => "Invalid transaction structure",
    })),
}) {
    // biome-ignore lint/suspicious/noExplicitAny: generic transaction return type
    get tx() {
        return this.value;
    }
    get branded() {
        return this.tx;
    }
    static fromBranded(brand) {
        // biome-ignore lint/suspicious/noExplicitAny: branded type coercion
        return new TransactionSchema({ value: brand });
    }
    // biome-ignore lint/suspicious/noExplicitAny: RPC input has dynamic structure
    static fromRpc(rpc) {
        const tx = _fromRpc(rpc);
        return new TransactionSchema({ value: tx });
    }
    static deserialize(bytes) {
        const tx = _deserialize(bytes);
        return new TransactionSchema({ value: tx });
    }
    // biome-ignore lint/suspicious/noExplicitAny: RPC output has dynamic structure
    toRpc() {
        return _toRpc(this.tx);
    }
    serialize() {
        return _serialize_internal.call(this.tx);
    }
    hash() {
        // biome-ignore lint/suspicious/noExplicitAny: internal call return type
        return _hash_internal.call(this.tx);
    }
    getSigningHash() {
        // biome-ignore lint/suspicious/noExplicitAny: internal call return type
        return _getSigningHash_internal.call(this.tx);
    }
    getSender() {
        // biome-ignore lint/suspicious/noExplicitAny: internal call return type
        return _getSender_internal.call(this.tx);
    }
    verifySignature() {
        return _verifySignature_internal.call(this.tx);
    }
    format() {
        return _format_internal.call(this.tx);
    }
    getGasPrice(baseFee) {
        return _getGasPrice_internal.call(this.tx, baseFee);
    }
    hasAccessList() {
        return _hasAccessList_internal.call(this.tx);
    }
    // biome-ignore lint/suspicious/noExplicitAny: access list has dynamic structure
    getAccessList() {
        return _getAccessList_internal.call(this.tx);
    }
    getChainId() {
        return _getChainId_internal.call(this.tx);
    }
    isSigned() {
        return _isSigned_internal.call(this.tx);
    }
    static detectType(bytes) {
        return _detectType(bytes);
    }
}

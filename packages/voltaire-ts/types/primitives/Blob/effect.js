import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { calculateGas as _calculateGas, estimateBlobCount as _estimateBlobCount, from as _from, fromData as _fromData, isValid as _isValid, toData as _toData, SIZE, } from "./index.js";
export const BlobBrand = Brand.refined((b) => b instanceof Uint8Array && b.length === SIZE && _isValid(b), () => Brand.error("Invalid blob: wrong size or structure"));
export class BlobSchema extends Schema.Class("Blob")({
    value: Schema.Uint8ArrayFromSelf.pipe(Schema.filter((b) => b.length === SIZE, {
        message: () => `Blob must be ${SIZE} bytes`,
    })),
}) {
    get blob() {
        return this.value;
    }
    get branded() {
        return this.value;
    }
    static fromBranded(brand) {
        return new BlobSchema({ value: brand });
    }
    static from(bytes) {
        return new BlobSchema({ value: _from(bytes) });
    }
    static fromData(data) {
        return new BlobSchema({ value: _fromData(data) });
    }
    toData() {
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        return _toData(this.blob);
    }
    static estimateBlobCount(size) {
        return _estimateBlobCount(size);
    }
    static calculateGas(count) {
        return _calculateGas(count);
    }
}

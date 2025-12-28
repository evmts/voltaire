import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";

import {
	SIZE,
	calculateGas as _calculateGas,
	estimateBlobCount as _estimateBlobCount,
} from "./index.js";
import {
	from as _from,
	fromData as _fromData,
	isValid as _isValid,
	toData as _toData,
} from "./index.js";

export type BlobBrand = Uint8Array & Brand.Brand<"Blob">;

export const BlobBrand = Brand.refined<BlobBrand>(
	(b): b is BlobBrand =>
		b instanceof Uint8Array && b.length === SIZE && _isValid(b),
	() => Brand.error("Invalid blob: wrong size or structure"),
);

export class BlobSchema extends Schema.Class<BlobSchema>("Blob")({
	value: Schema.Uint8ArrayFromSelf.pipe(
		Schema.filter((b): b is Uint8Array => b.length === SIZE, {
			message: () => `Blob must be ${SIZE} bytes`,
		}),
	),
}) {
	get blob(): Uint8Array {
		return this.value;
	}
	get branded(): BlobBrand {
		return this.value as BlobBrand;
	}
	static fromBranded(brand: BlobBrand): BlobSchema {
		return new BlobSchema({ value: brand });
	}

	static from(bytes: Uint8Array): BlobSchema {
		return new BlobSchema({ value: _from(bytes) as unknown as Uint8Array });
	}
	static fromData(data: Uint8Array): BlobSchema {
		return new BlobSchema({ value: _fromData(data) as unknown as Uint8Array });
	}
	toData(): Uint8Array {
		return _toData(this.blob as any);
	}
	static estimateBlobCount(size: number): number {
		return _estimateBlobCount(size);
	}
	static calculateGas(count: number): number {
		return _calculateGas(count);
	}
}

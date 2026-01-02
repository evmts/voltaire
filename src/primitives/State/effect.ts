import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import {
	create as _create,
	equals as _equals,
	from as _from,
	hashCode as _hashCode,
	toString as _toString,
} from "./index.js";
import type { StorageKeyType } from "./StorageKeyType.js";

const isAddr20 = (b: unknown): b is Uint8Array =>
	b instanceof Uint8Array && b.length === 20;

export type StorageKeyBrand = StorageKeyType & Brand.Brand<"StorageKey">;

export const StorageKeyBrand = Brand.refined<StorageKeyBrand>(
	(_): _ is StorageKeyBrand => true,
	() => Brand.error("Invalid storage key"),
);

export class StorageKeySchema extends Schema.Class<StorageKeySchema>(
	"StorageKey",
)({
	address: Schema.Uint8ArrayFromSelf.pipe(
		Schema.filter(isAddr20, { message: () => "address must be 20 bytes" }),
	),
	slot: Schema.BigIntFromSelf,
}) {
	get key(): StorageKeyType {
		// biome-ignore lint/suspicious/noExplicitAny: Effect Schema type coercion to branded type
		return _create(this.address as any, this.slot);
	}
	get branded(): StorageKeyBrand {
		return this.key as StorageKeyBrand;
	}
	static fromBranded(brand: StorageKeyBrand): StorageKeySchema {
		return new StorageKeySchema({
			// biome-ignore lint/suspicious/noExplicitAny: branded type property access
			address: (brand as any).address,
			// biome-ignore lint/suspicious/noExplicitAny: branded type property access
			slot: (brand as any).slot,
			// biome-ignore lint/suspicious/noExplicitAny: Effect Schema type coercion
		}) as any;
	}
	static from(
		value: StorageKeyType | { address: Uint8Array; slot: bigint },
	): StorageKeySchema {
		// biome-ignore lint/suspicious/noExplicitAny: branded type property access
		if (value && (value as any).address && (value as any).slot !== undefined)
			// biome-ignore lint/suspicious/noExplicitAny: branded type coercion
			return new StorageKeySchema(value as any);
		// biome-ignore lint/suspicious/noExplicitAny: branded type coercion
		const k = _from(value as any);
		return new StorageKeySchema({
			// biome-ignore lint/suspicious/noExplicitAny: branded type property access
			address: (k as any).address,
			// biome-ignore lint/suspicious/noExplicitAny: branded type property access
			slot: (k as any).slot,
			// biome-ignore lint/suspicious/noExplicitAny: Effect Schema type coercion
		}) as any;
	}
	override toString(): string {
		return _toString(this.key);
	}
	equals(other: StorageKeySchema | StorageKeyType): boolean {
		const rhs = other instanceof StorageKeySchema ? other.key : other;
		return _equals(this.key, rhs);
	}
	hashCode(): number {
		return _hashCode(this.key);
	}
}

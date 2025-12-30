import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";

import type { BrandedAccessList, Item } from "./AccessListType.js";
import { assertValid as _assertValid } from "./assertValid.js";
import { create as _create } from "./create.js";
import { deduplicate as _deduplicate } from "./deduplicate.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { gasCost as _gasCost } from "./gasCost.js";
import { gasSavings as _gasSavings } from "./gasSavings.js";
import { hasSavings as _hasSavings } from "./hasSavings.js";
import { includesAddress as _includesAddress } from "./includesAddress.js";
import { includesStorageKey as _includesStorageKey } from "./includesStorageKey.js";
import { is as _is } from "./is.js";
import { isItem as _isItem } from "./isItem.js";
import { keysFor as _keysFor } from "./keysFor.js";
import { merge as _merge } from "./merge.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { withAddress as _withAddress } from "./withAddress.js";
import { withStorageKey as _withStorageKey } from "./withStorageKey.js";

const isAddr20 = (b: unknown): b is Uint8Array =>
	b instanceof Uint8Array && b.length === 20;
const isHash32 = (b: unknown): b is Uint8Array =>
	b instanceof Uint8Array && b.length === 32;

export type AccessListBrand = BrandedAccessList & Brand.Brand<"AccessList">;

export const AccessListBrand = Brand.refined<AccessListBrand>(
	(list): list is AccessListBrand => _is(list),
	() => Brand.error("Invalid AccessList: structure validation failed"),
);

const ItemSchema = Schema.Struct({
	address: Schema.Uint8ArrayFromSelf.pipe(
		Schema.filter(isAddr20, { message: () => "address must be 20 bytes" }),
	),
	storageKeys: Schema.Array(
		Schema.Uint8ArrayFromSelf.pipe(
			Schema.filter(isHash32, {
				message: () => "storage key must be 32 bytes",
			}),
		),
	),
});

export class AccessListSchema extends Schema.Class<AccessListSchema>(
	"AccessList",
)({
	value: Schema.Array(ItemSchema),
}) {
	get accessList(): BrandedAccessList {
		// value is validated structurally; coerce to branded type
		return this.value as unknown as BrandedAccessList;
	}

	get branded(): AccessListBrand {
		return this.accessList as AccessListBrand;
	}

	static fromBranded(list: AccessListBrand): AccessListSchema {
		return new AccessListSchema({
			value: list as unknown as {
				address: Uint8Array;
				storageKeys: Uint8Array[];
			}[],
		});
	}

	static from(value: readonly Item[] | Uint8Array): AccessListSchema {
		// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		const list = _from(value as any);
		return AccessListSchema.fromBranded(list as AccessListBrand);
	}

	static fromBytes(bytes: Uint8Array): AccessListSchema {
		const list = _fromBytes(bytes);
		return AccessListSchema.fromBranded(list as AccessListBrand);
	}

	static create(): AccessListSchema {
		const list = _create();
		return AccessListSchema.fromBranded(list as AccessListBrand);
	}

	toBytes(): Uint8Array {
		return _toBytes(this.accessList);
	}
	gasCost(): bigint {
		return _gasCost(this.accessList);
	}
	gasSavings(): bigint {
		return _gasSavings(this.accessList);
	}
	hasSavings(): boolean {
		return _hasSavings(this.accessList);
	}
	includesAddress(address: Uint8Array): boolean {
		// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		return _includesAddress(this.accessList, address as any);
	}
	includesStorageKey(address: Uint8Array, storageKey: Uint8Array): boolean {
		return _includesStorageKey(
			this.accessList,
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			address as any,
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			storageKey as any,
		);
	}
	keysFor(address: Uint8Array): readonly Uint8Array[] | undefined {
		// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		return _keysFor(this.accessList, address as any) as any;
	}
	deduplicate(): AccessListSchema {
		// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		return AccessListSchema.fromBranded(_deduplicate(this.accessList) as any);
	}
	withAddress(address: Uint8Array): AccessListSchema {
		return AccessListSchema.fromBranded(
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			_withAddress(this.accessList, address as any) as any,
		);
	}
	withStorageKey(
		address: Uint8Array,
		storageKey: Uint8Array,
	): AccessListSchema {
		return AccessListSchema.fromBranded(
			_withStorageKey(
				this.accessList,
				// biome-ignore lint/suspicious/noExplicitAny: type coercion required
				address as any,
				// biome-ignore lint/suspicious/noExplicitAny: type coercion required
				storageKey as any,
				// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			) as any,
		);
	}
	merge(...others: (AccessListSchema | BrandedAccessList)[]): AccessListSchema {
		const lists = others.map((o) =>
			o instanceof AccessListSchema ? o.accessList : o,
		);
		return AccessListSchema.fromBranded(
			// biome-ignore lint/suspicious/noExplicitAny: type coercion required
			_merge(this.accessList, ...lists) as any,
		);
	}
	assertValid(): void {
		_assertValid(this.accessList);
	}
}

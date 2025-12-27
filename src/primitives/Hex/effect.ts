import * as Schema from "effect/Schema";
import * as Brand from "effect/Brand";

import type { HexType } from "./HexType.js";
import { isHex as _isHex } from "./isHex.js";
import { validate as _validate } from "./validate.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { equals as _equals } from "./equals.js";

export type HexBrand = string & Brand.Brand<"Hex">;

export const HexBrand = Brand.refined<HexBrand>(
  (s): s is string & Brand.Brand<"Hex"> => typeof s === "string" && _isHex(s),
  (s) => Brand.error(`Expected 0x-prefixed hex string, got ${typeof s}`),
);

export class HexSchema extends Schema.Class<HexSchema>("Hex")({
  value: Schema.String.pipe(
    Schema.filter((s): s is string => _isHex(s), {
      message: () => "Invalid hex: must start with 0x and contain hex chars",
    }),
  ),
}) {
  get hex(): HexType {
    return this.value as HexType;
  }

  get branded(): HexBrand {
    return this.value as HexBrand;
  }

  static fromBranded(brand: HexBrand): HexSchema {
    return new HexSchema({ value: brand });
  }

  static from(value: string): HexSchema {
    const hex = _validate(value);
    return new HexSchema({ value: hex });
  }

  static fromBytes(bytes: Uint8Array): HexSchema {
    const hex = _fromBytes(bytes);
    return new HexSchema({ value: hex });
  }

  toBytes(): Uint8Array {
    return _toBytes(this.hex);
  }

  override toString(): string {
    return this.hex;
  }

  equals(other: HexSchema | HexType | string): boolean {
    const rhs = other instanceof HexSchema ? other.hex : (other as any);
    return _equals(this.hex, rhs);
  }
}

export const HexFromBytes = Schema.transform(
  Schema.Uint8ArrayFromSelf,
  Schema.instanceOf(HexSchema),
  {
    decode: (bytes) => HexSchema.fromBytes(bytes),
    encode: (h) => h.toBytes(),
  },
);

export const HexFromUnknown = Schema.transform(
  Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf),
  Schema.instanceOf(HexSchema),
  {
    decode: (value) =>
      typeof value === "string" ? HexSchema.from(value) : HexSchema.fromBytes(value),
    encode: (h) => h.hex,
  },
);

import type { BrandedHex } from "../../Hex/index.js";
import type { BrandedUint } from "../../Uint/index.js";
import type { Checksummed } from "./ChecksumAddress.js";
import type { Lowercase } from "./LowercaseAddress.js";
import type { Uppercase } from "./UppercaseAddress.js";

export type BrandedAddress = Uint8Array & {
	readonly __tag: "Address";
	toBase64: typeof Uint8Array.prototype.toBase64;
	setFromBase64: typeof Uint8Array.prototype.setFromBase64;
	toHex(this: BrandedAddress): BrandedHex;
	setFromHex: typeof Uint8Array.prototype.setFromHex;
	toChecksummed(this: BrandedAddress): Checksummed;
	toLowercase(this: BrandedAddress): Lowercase;
	toUppercase(this: BrandedAddress): Uppercase;
	toU256(this: BrandedAddress): BrandedUint;
	toShortHex(
		this: BrandedAddress,
		sliceLength?: number,
		leadingLength?: number,
	): string;
	format(this: BrandedAddress): string;
	compare(this: BrandedAddress, other: BrandedAddress): number;
	lessThan(this: BrandedAddress, other: BrandedAddress): boolean;
	greaterThan(this: BrandedAddress, other: BrandedAddress): boolean;
	isZero(this: BrandedAddress): boolean;
	equals(this: BrandedAddress, other: BrandedAddress): boolean;
	toAbiEncoded(this: BrandedAddress): Uint8Array;
	calculateCreateAddress(this: BrandedAddress, nonce: bigint): BrandedAddress;
	calculateCreate2Address(
		this: BrandedAddress,
		salt: Uint8Array,
		initCode: Uint8Array,
	): BrandedAddress;
};

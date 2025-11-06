import type { BrandedAddress } from "./BrandedAddress/BrandedAddress.js";
import { calculateCreate2Address } from "./BrandedAddress/calculateCreate2Address.js";
import { calculateCreateAddress } from "./BrandedAddress/calculateCreateAddress.js";
import { compare } from "./BrandedAddress/compare.js";
import { SIZE } from "./BrandedAddress/constants.js";
import { equals } from "./BrandedAddress/equals.js";
// @ts-expect-error - Used in typeof expression
import { from } from "./BrandedAddress/from.js";
// @ts-expect-error - Used in typeof expression
import { fromAbiEncoded } from "./BrandedAddress/fromAbiEncoded.js";
// @ts-expect-error - Used in typeof expression
import { fromHex } from "./BrandedAddress/fromHex.js";
// @ts-expect-error - Used in typeof expression
import { fromNumber } from "./BrandedAddress/fromNumber.js";
// @ts-expect-error - Used in typeof expression
import { fromPublicKey } from "./BrandedAddress/fromPublicKey.js";
import { greaterThan } from "./BrandedAddress/greaterThan.js";
import { is } from "./BrandedAddress/is.js";
import { isValid } from "./BrandedAddress/isValid.js";
import { isValidChecksum } from "./BrandedAddress/isValidChecksum.js";
import { isZero } from "./BrandedAddress/isZero.js";
import { lessThan } from "./BrandedAddress/lessThan.js";
import { toAbiEncoded } from "./BrandedAddress/toAbiEncoded.js";
import { toChecksummed } from "./BrandedAddress/toChecksummed.js";
import { toHex } from "./BrandedAddress/toHex.js";
import { toLowercase } from "./BrandedAddress/toLowercase.js";
import { toShortHex } from "./BrandedAddress/toShortHex.js";
import { toU256 } from "./BrandedAddress/toU256.js";
import { toUppercase } from "./BrandedAddress/toUppercase.js";
import { zero } from "./BrandedAddress/zero.js";

type AddressPrototype = BrandedAddress & {
	toBase64: typeof Uint8Array.prototype.toBase64;
	setFromBase64: typeof Uint8Array.prototype.setFromBase64;
	toHex(this: BrandedAddress): ReturnType<typeof toHex>;
	setFromHex: typeof Uint8Array.prototype.setFromHex;
	toChecksummed(this: BrandedAddress): ReturnType<typeof toChecksummed>;
	toLowercase(this: BrandedAddress): ReturnType<typeof toLowercase>;
	toUppercase(this: BrandedAddress): ReturnType<typeof toUppercase>;
	toU256(this: BrandedAddress): ReturnType<typeof toU256>;
	toShortHex(this: BrandedAddress): ReturnType<typeof toShortHex>;
	compare(
		this: BrandedAddress,
		other: BrandedAddress,
	): ReturnType<typeof compare>;
	lessThan(
		this: BrandedAddress,
		other: BrandedAddress,
	): ReturnType<typeof lessThan>;
	greaterThan(
		this: BrandedAddress,
		other: BrandedAddress,
	): ReturnType<typeof greaterThan>;
	isZero(this: BrandedAddress): ReturnType<typeof isZero>;
	equals(
		this: BrandedAddress,
		other: BrandedAddress,
	): ReturnType<typeof equals>;
	toAbiEncoded(this: BrandedAddress): ReturnType<typeof toAbiEncoded>;
	calculateCreateAddress(
		this: BrandedAddress,
		nonce: Parameters<typeof calculateCreateAddress>[1],
	): ReturnType<typeof calculateCreateAddress>;
	calculateCreate2Address(
		this: BrandedAddress,
		salt: Parameters<typeof calculateCreate2Address>[1],
		initCode: Parameters<typeof calculateCreate2Address>[2],
	): ReturnType<typeof calculateCreate2Address>;
};

export interface AddressConstructor {
	new (value: number | bigint | string | Uint8Array): AddressPrototype;
	(value: number | bigint | string | Uint8Array): AddressPrototype;
	prototype: AddressPrototype;
	fromBase64(value: string): AddressPrototype;
	fromHex(value: string): AddressPrototype;
	from(value: number | bigint | string | Uint8Array): AddressPrototype;
	fromNumber(value: number | bigint): AddressPrototype;
	fromPublicKey(x: bigint, y: bigint): AddressPrototype;
	fromAbiEncoded(value: Uint8Array): AddressPrototype;
	toHex: typeof toHex;
	toChecksummed: typeof toChecksummed;
	toLowercase: typeof toLowercase;
	toUppercase: typeof toUppercase;
	toU256: typeof toU256;
	toAbiEncoded: typeof toAbiEncoded;
	toShortHex: typeof toShortHex;
	isZero: typeof isZero;
	equals: typeof equals;
	isValid: typeof isValid;
	isValidChecksum: typeof isValidChecksum;
	is: typeof is;
	zero: typeof zero;
	compare: typeof compare;
	lessThan: typeof lessThan;
	greaterThan: typeof greaterThan;
	calculateCreateAddress: typeof calculateCreateAddress;
	calculateCreate2Address: typeof calculateCreate2Address;
	SIZE: typeof SIZE;
}

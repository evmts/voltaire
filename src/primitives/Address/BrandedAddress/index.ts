// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedAddress.js";
import * as Checksummed from "./ChecksumAddress.js";
export { Checksummed };
import * as Lowercase from "./LowercaseAddress.js";
export { Lowercase };
import * as Uppercase from "./UppercaseAddress.js";
export { Uppercase };

import { calculateCreate2Address } from "./calculateCreate2Address.js";
import { calculateCreateAddress } from "./calculateCreateAddress.js";
import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { SIZE } from "./constants.js";
import { deduplicateAddresses } from "./deduplicateAddresses.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromAbiEncoded } from "./fromAbiEncoded.js";
import { fromBase64 } from "./fromBase64.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { fromPublicKey } from "./fromPublicKey.js";
import { fromPrivateKey } from "./fromPrivateKey.js";
import { greaterThan } from "./greaterThan.js";
import { is } from "./is.js";
import { isValid } from "./isValid.js";
import { isValidChecksum } from "./isValidChecksum.js";
import { isZero } from "./isZero.js";
import { lessThan } from "./lessThan.js";
import { sortAddresses } from "./sortAddresses.js";
import { toAbiEncoded } from "./toAbiEncoded.js";
import { toBytes } from "./toBytes.js";
import { toChecksummed } from "./toChecksummed.js";
import { toHex } from "./toHex.js";
import { toLowercase } from "./toLowercase.js";
import { toShortHex } from "./toShortHex.js";
import { toU256 } from "./toU256.js";
import { toUppercase } from "./toUppercase.js";
import { zero } from "./zero.js";

// Export individual functions
export {
	from,
	fromHex,
	fromBase64,
	fromBytes,
	fromNumber,
	fromPublicKey,
	fromPrivateKey,
	fromAbiEncoded,
	toHex,
	toBytes,
	toChecksummed,
	toLowercase,
	toUppercase,
	toU256,
	toAbiEncoded,
	toShortHex,
	isZero,
	equals,
	isValid,
	isValidChecksum,
	is,
	zero,
	clone,
	calculateCreateAddress,
	calculateCreate2Address,
	compare,
	lessThan,
	greaterThan,
	sortAddresses,
	deduplicateAddresses,
	SIZE,
};

// Namespace export
export const BrandedAddress = {
	from,
	fromHex,
	fromBase64,
	fromBytes,
	fromNumber,
	fromPublicKey,
	fromPrivateKey,
	fromAbiEncoded,
	toHex,
	toBytes,
	toChecksummed,
	toLowercase,
	toUppercase,
	toU256,
	toAbiEncoded,
	toShortHex,
	isZero,
	equals,
	isValid,
	isValidChecksum,
	is,
	zero,
	clone,
	calculateCreateAddress,
	calculateCreate2Address,
	compare,
	lessThan,
	greaterThan,
	sortAddresses,
	deduplicateAddresses,
	SIZE,
	Checksummed,
	Lowercase,
	Uppercase,
};

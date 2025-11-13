// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedAddress.js";

// Export factory functions from ChecksumAddress
export { From, IsValid } from "./ChecksumAddress.js";
import * as Checksummed from "./ChecksumAddress.js";
export { Checksummed };

// Export factory functions from wrappers
export { ToChecksummed } from "./toChecksummed.js";
export { IsValidChecksum } from "./isValidChecksum.js";
export { CalculateCreateAddress } from "./calculateCreateAddress.js";
export { CalculateCreate2Address } from "./calculateCreate2Address.js";
export { FromPublicKey } from "./fromPublicKey.js";
export { FromPrivateKey } from "./fromPrivateKey.js";

// Export backward-compatible wrappers that inject dependencies automatically
import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { derivePublicKey } from "../../../crypto/Secp256k1/derivePublicKey.js";
import { encode as rlpEncode } from "../../Rlp/BrandedRlp/encode.js";
import { CalculateCreate2Address as CalculateCreate2AddressFactory } from "./calculateCreate2Address.js";
import { CalculateCreateAddress as CalculateCreateAddressFactory } from "./calculateCreateAddress.js";
import { FromPrivateKey as FromPrivateKeyFactory } from "./fromPrivateKey.js";
import { FromPublicKey as FromPublicKeyFactory } from "./fromPublicKey.js";
import { IsValidChecksum as IsValidChecksumFactory } from "./isValidChecksum.js";
import { ToChecksummed as ToChecksummedFactory } from "./toChecksummed.js";

/**
 * Convert Address to EIP-55 checksummed hex string (with auto-injected keccak256)
 *
 * For tree-shakeable version without auto-injected crypto, use `ToChecksummed({ keccak256 })` factory
 */
export const toChecksummed = ToChecksummedFactory({ keccak256 });

/**
 * Check if string has valid EIP-55 checksum (with auto-injected keccak256)
 *
 * For tree-shakeable version without auto-injected crypto, use `IsValidChecksum({ keccak256 })` factory
 */
export const isValidChecksum = IsValidChecksumFactory({ keccak256 });

/**
 * Calculate CREATE contract address (with auto-injected keccak256 and rlpEncode)
 *
 * For tree-shakeable version without auto-injected crypto, use `CalculateCreateAddress({ keccak256, rlpEncode })` factory
 */
export const calculateCreateAddress = CalculateCreateAddressFactory({
	keccak256,
	rlpEncode,
});

/**
 * Calculate CREATE2 contract address (with auto-injected keccak256)
 *
 * For tree-shakeable version without auto-injected crypto, use `CalculateCreate2Address({ keccak256 })` factory
 */
export const calculateCreate2Address = CalculateCreate2AddressFactory({
	keccak256,
});

/**
 * Create Address from secp256k1 public key coordinates (with auto-injected keccak256)
 *
 * For tree-shakeable version without auto-injected crypto, use `FromPublicKey({ keccak256 })` factory
 */
export const fromPublicKey = FromPublicKeyFactory({ keccak256 });

/**
 * Create Address from secp256k1 private key (with auto-injected crypto)
 *
 * For tree-shakeable version without auto-injected crypto, use `FromPrivateKey({ keccak256, derivePublicKey })` factory
 */
export const fromPrivateKey = FromPrivateKeyFactory({
	keccak256,
	derivePublicKey,
});

import * as Lowercase from "./LowercaseAddress.js";
export { Lowercase };
import * as Uppercase from "./UppercaseAddress.js";
export { Uppercase };

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
import { greaterThan } from "./greaterThan.js";
import { is } from "./is.js";
import { isValid } from "./isValid.js";
import { isZero } from "./isZero.js";
import { lessThan } from "./lessThan.js";
import { sortAddresses } from "./sortAddresses.js";
import { toAbiEncoded } from "./toAbiEncoded.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toLowercase } from "./toLowercase.js";
import { toShortHex } from "./toShortHex.js";
import { toU256 } from "./toU256.js";
import { toUppercase } from "./toUppercase.js";
import { zero } from "./zero.js";

// Export individual functions (toChecksummed, isValidChecksum, calculateCreateAddress, calculateCreate2Address, fromPublicKey, fromPrivateKey already exported as const above)
export {
	from,
	fromHex,
	fromBase64,
	fromBytes,
	fromNumber,
	fromAbiEncoded,
	toHex,
	toBytes,
	toLowercase,
	toUppercase,
	toU256,
	toAbiEncoded,
	toShortHex,
	isZero,
	equals,
	isValid,
	is,
	zero,
	clone,
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
	FromPublicKey: FromPublicKeyFactory,
	fromPrivateKey,
	FromPrivateKey: FromPrivateKeyFactory,
	fromAbiEncoded,
	toHex,
	toBytes,
	toChecksummed,
	ToChecksummed: ToChecksummedFactory,
	toLowercase,
	toUppercase,
	toU256,
	toAbiEncoded,
	toShortHex,
	isZero,
	equals,
	isValid,
	isValidChecksum,
	IsValidChecksum: IsValidChecksumFactory,
	is,
	zero,
	clone,
	calculateCreateAddress,
	CalculateCreateAddress: CalculateCreateAddressFactory,
	calculateCreate2Address,
	CalculateCreate2Address: CalculateCreate2AddressFactory,
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

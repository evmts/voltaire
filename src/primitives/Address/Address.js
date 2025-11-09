import { InvalidAddressLengthError } from "./BrandedAddress/errors.js";
import * as BrandedAddress from "./BrandedAddress/index.js";
import {
	setFromBase64Polyfill,
	setFromHexPolyfill,
	toBase64Polyfill,
} from "./BrandedAddress/polyfills.js";

/**
 * Factory function for creating Address instances
 * @param {number | bigint | string | Uint8Array} value
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
export function Address(value) {
	const result = BrandedAddress.from(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
}

// Static constructors
/**
 * @param {number | bigint | string | Uint8Array} value
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.from = (value) => {
	const result = BrandedAddress.from(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * @param {string} value
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.fromBase64 = (value) => {
	const result = BrandedAddress.fromBase64(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * @param {string} value
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.fromHex = (value) => {
	const result = BrandedAddress.fromHex(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * @param {Uint8Array} value
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.fromBytes = (value) => {
	const result = BrandedAddress.fromBytes(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * @param {number | bigint} value
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.fromNumber = (value) => {
	const result = BrandedAddress.fromNumber(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * @param {bigint} x
 * @param {bigint} y
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.fromPublicKey = (x, y) => {
	const result = BrandedAddress.fromPublicKey(x, y);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * @param {Uint8Array} value
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.fromPrivateKey = (value) => {
	const result = BrandedAddress.fromPrivateKey(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * @param {Uint8Array} value
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.fromAbiEncoded = (value) => {
	const result = BrandedAddress.fromAbiEncoded(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

// Static utility methods (don't return Address instances)
Address.toHex = BrandedAddress.toHex;
Address.toChecksummed = BrandedAddress.toChecksummed;
Address.toLowercase = BrandedAddress.toLowercase;
Address.toUppercase = BrandedAddress.toUppercase;
Address.toU256 = BrandedAddress.toU256;
Address.toAbiEncoded = BrandedAddress.toAbiEncoded;
Address.toShortHex = BrandedAddress.toShortHex;
Address.isZero = BrandedAddress.isZero;
Address.equals = BrandedAddress.equals;
Address.isValid = BrandedAddress.isValid;
Address.isValidChecksum = BrandedAddress.isValidChecksum;
Address.is = BrandedAddress.is;

/**
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.zero = () => {
	const result = BrandedAddress.zero();
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * @param {...number} items
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.of = (...items) => {
	const result = Uint8Array.of(...items);
	if (result.length !== BrandedAddress.SIZE) {
		throw new InvalidAddressLengthError(
			`Address must be ${BrandedAddress.SIZE} bytes, got ${result.length}`,
		);
	}
	Object.setPrototypeOf(result, Address.prototype);
	return /** @type {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} */ (
		result
	);
};

Address.compare = BrandedAddress.compare;
Address.lessThan = BrandedAddress.lessThan;
Address.greaterThan = BrandedAddress.greaterThan;

/**
 * @param {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} address
 * @param {bigint} nonce
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.calculateCreateAddress = (address, nonce) => {
	const result = BrandedAddress.calculateCreateAddress(address, nonce);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * @param {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} address
 * @param {bigint | Uint8Array} salt
 * @param {Uint8Array} initCode
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.calculateCreate2Address = (address, salt, initCode) => {
	const result = BrandedAddress.calculateCreate2Address(
		address,
		salt,
		initCode,
	);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

Address.SIZE = BrandedAddress.SIZE;

// Set up Address.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(Address.prototype, Uint8Array.prototype);

// Instance methods
Address.prototype.toBase64 = Uint8Array.prototype.toBase64 ?? toBase64Polyfill;
Address.prototype.setFromBase64 =
	Uint8Array.prototype.setFromBase64 ?? setFromBase64Polyfill;
Address.prototype.toHex = BrandedAddress.toHex.call.bind(BrandedAddress.toHex);
Address.prototype.setFromHex =
	Uint8Array.prototype.setFromHex ?? setFromHexPolyfill;
Address.prototype.toChecksummed = BrandedAddress.toChecksummed.call.bind(
	BrandedAddress.toChecksummed,
);
Address.prototype.toLowercase = BrandedAddress.toLowercase.call.bind(
	BrandedAddress.toLowercase,
);
Address.prototype.toUppercase = BrandedAddress.toUppercase.call.bind(
	BrandedAddress.toUppercase,
);
Address.prototype.toU256 = BrandedAddress.toU256.call.bind(
	BrandedAddress.toU256,
);
Address.prototype.toAbiEncoded = BrandedAddress.toAbiEncoded.call.bind(
	BrandedAddress.toAbiEncoded,
);
Address.prototype.toShortHex = BrandedAddress.toShortHex.call.bind(
	BrandedAddress.toShortHex,
);
Address.prototype.compare = BrandedAddress.compare.call.bind(
	BrandedAddress.compare,
);
Address.prototype.lessThan = BrandedAddress.lessThan.call.bind(
	BrandedAddress.lessThan,
);
Address.prototype.greaterThan = BrandedAddress.greaterThan.call.bind(
	BrandedAddress.greaterThan,
);
Address.prototype.isZero = BrandedAddress.isZero.call.bind(
	BrandedAddress.isZero,
);
Address.prototype.equals = BrandedAddress.equals.call.bind(
	BrandedAddress.equals,
);
/**
 * @this {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 * @param {bigint} nonce
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.prototype.calculateCreateAddress = function (nonce) {
	const result = BrandedAddress.calculateCreateAddress(
		/** @type {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} */ (
			this
		),
		nonce,
	);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
/**
 * @this {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 * @param {bigint | Uint8Array} salt
 * @param {Uint8Array} initCode
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 */
Address.prototype.calculateCreate2Address = function (salt, initCode) {
	const result = BrandedAddress.calculateCreate2Address(
		/** @type {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} */ (
			this
		),
		salt,
		initCode,
	);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * @this {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 * @param {number} _depth
 * @param {object} _options
 * @returns {string}
 */
Address.prototype[Symbol.for("nodejs.util.inspect.custom")] = function (
	_depth,
	_options,
) {
	return `Address(${BrandedAddress.toChecksummed(
		/** @type {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} */ (
			this
		),
	)})`;
};

/**
 * @this {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 * @returns {string}
 */
Address.prototype.toString = function () {
	return `Address(${BrandedAddress.toHex(
		/** @type {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} */ (
			this
		),
	)})`;
};

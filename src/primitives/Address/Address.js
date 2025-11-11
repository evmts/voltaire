import { InvalidAddressLengthError } from "./BrandedAddress/errors.js";
import * as BrandedAddress from "./BrandedAddress/index.js";
import {
	setFromBase64Polyfill,
	setFromHexPolyfill,
	toBase64Polyfill,
} from "./BrandedAddress/polyfills.js";

/**
 * Factory function for creating Address instances with prototype chain
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {number | bigint | string | Uint8Array} value - Value to convert to Address
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Address instance with prototype methods
 * @throws {Error} If value format is invalid
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const addr = Address('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * console.log(addr.toChecksummed());
 * ```
 */
export function Address(value) {
	const result = BrandedAddress.from(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
}

// Static constructors
/**
 * Creates an Address from various input types (universal factory)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {number | bigint | string | Uint8Array} value - Value to convert (hex string, bytes, or number)
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Address instance
 * @throws {Error} If value format is invalid
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const addr1 = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * const addr2 = Address.from(new Uint8Array(20));
 * const addr3 = Address.from(123n);
 * ```
 */
Address.from = (value) => {
	const result = BrandedAddress.from(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * Creates an Address from base64-encoded string
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {string} value - Base64-encoded address string
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Address instance
 * @throws {Error} If base64 format is invalid
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const addr = Address.fromBase64('dC01zGY0wFMpJaO4RLyedZXyUeM=');
 * ```
 */
Address.fromBase64 = (value) => {
	const result = BrandedAddress.fromBase64(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * Creates an Address from hex string (with or without 0x prefix)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {string} value - Hex string address (40 or 42 characters)
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Address instance
 * @throws {Error} If hex format is invalid or length incorrect
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const addr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * ```
 */
Address.fromHex = (value) => {
	const result = BrandedAddress.fromHex(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * Creates an Address from 20-byte Uint8Array
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {Uint8Array} value - 20-byte array representing address
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Address instance
 * @throws {Error} If not exactly 20 bytes
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const bytes = new Uint8Array(20);
 * const addr = Address.fromBytes(bytes);
 * ```
 */
Address.fromBytes = (value) => {
	const result = BrandedAddress.fromBytes(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * Creates an Address from number or bigint (right-padded to 20 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {number | bigint} value - Numeric value to convert
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Address instance
 * @throws {never} Never throws - accepts any valid number/bigint
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const addr = Address.fromNumber(123n);
 * ```
 */
Address.fromNumber = (value) => {
	const result = BrandedAddress.fromNumber(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * Derives an Address from secp256k1 public key coordinates (keccak256(pubkey)[12:32])
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {bigint} x - Public key X coordinate (32 bytes)
 * @param {bigint} y - Public key Y coordinate (32 bytes)
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Derived address
 * @throws {never} Never throws - accepts any valid bigint coordinates
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const xCoord = 0x123n;
 * const yCoord = 0x456n;
 * const addr = Address.fromPublicKey(xCoord, yCoord);
 * ```
 */
Address.fromPublicKey = (x, y) => {
	const result = BrandedAddress.fromPublicKey(x, y);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * Derives an Address from secp256k1 private key (derives pubkey then address)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {Uint8Array} value - 32-byte private key
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Derived address
 * @throws {Error} If private key is invalid
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const privateKey = new Uint8Array(32);
 * const addr = Address.fromPrivateKey(privateKey);
 * ```
 */
Address.fromPrivateKey = (value) => {
	const result = BrandedAddress.fromPrivateKey(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * Decodes an Address from ABI-encoded bytes (left-padded 32 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {Uint8Array} value - 32-byte ABI-encoded address (12 zero bytes + 20 address bytes)
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Address instance
 * @throws {Error} If not exactly 32 bytes
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const abiEncoded = new Uint8Array(32); // 12 zero bytes + 20 address bytes
 * const addr = Address.fromAbiEncoded(abiEncoded);
 * ```
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
 * Returns the zero address (0x0000000000000000000000000000000000000000)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Zero address
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const zero = Address.zero();
 * console.log(Address.isZero(zero)); // true
 * ```
 */
Address.zero = () => {
	const result = BrandedAddress.zero();
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * Creates an Address from variable number of byte values
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {...number} items - Byte values (must be exactly 20 bytes)
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Address instance
 * @throws {Error} If not exactly 20 byte values provided
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const addr = Address.of(0x74, 0x2d, 0x35, ..., 0xe3); // 20 bytes
 * ```
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
 * Calculates the CREATE contract address (keccak256(rlp([sender, nonce]))[12:32])
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} address - Deployer address
 * @param {bigint} nonce - Account nonce at deployment
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Computed contract address
 * @throws {never} Never throws - accepts any valid inputs
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const deployer = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * const contractAddr = Address.calculateCreateAddress(deployer, 42n);
 * ```
 */
Address.calculateCreateAddress = (address, nonce) => {
	const result = BrandedAddress.calculateCreateAddress(address, nonce);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

/**
 * Calculates the CREATE2 contract address (keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32])
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} address - Deployer address
 * @param {bigint | Uint8Array} salt - 32-byte salt value
 * @param {Uint8Array} initCode - Contract initialization code
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Computed contract address
 * @throws {never} Never throws - accepts any valid inputs
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const deployer = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * const salt = new Uint8Array(32);
 * const initCode = new Uint8Array([0x60, 0x80, ...]);
 * const contractAddr = Address.calculateCreate2Address(deployer, salt, initCode);
 * ```
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
 * Instance method to calculate CREATE contract address from this address
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @this {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 * @param {bigint} nonce - Account nonce at deployment
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Computed contract address
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const deployer = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * const contractAddr = deployer.calculateCreateAddress(42n);
 * ```
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
 * Instance method to calculate CREATE2 contract address from this address
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @this {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 * @param {bigint | Uint8Array} salt - 32-byte salt value
 * @param {Uint8Array} initCode - Contract initialization code
 * @returns {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} Computed contract address
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const deployer = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * const salt = new Uint8Array(32);
 * const initCode = new Uint8Array([0x60, 0x80]);
 * const contractAddr = deployer.calculateCreate2Address(salt, initCode);
 * ```
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
 * Custom Node.js inspect formatter for Address instances
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @this {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 * @param {number} _depth - Inspection depth (unused)
 * @param {object} _options - Inspection options (unused)
 * @returns {string} Formatted string representation
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const addr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * console.log(addr); // Address(0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb)
 * ```
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
 * Converts Address to string representation
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @this {import('./BrandedAddress/BrandedAddress.js').BrandedAddress}
 * @returns {string} String representation of address
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { Address } from './primitives/Address/Address.js';
 * const addr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * console.log(addr.toString()); // Address(0x742d35cc6634c0532925a3b844bc9e7595f0beb)
 * ```
 */
Address.prototype.toString = function () {
	return `Address(${BrandedAddress.toHex(
		/** @type {import('./BrandedAddress/BrandedAddress.js').BrandedAddress} */ (
			this
		),
	)})`;
};

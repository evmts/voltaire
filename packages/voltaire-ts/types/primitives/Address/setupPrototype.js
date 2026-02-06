import * as BrandedAddress from "./internal-index.js";
import { setFromBase64Polyfill, setFromHexPolyfill, toBase64Polyfill, } from "./polyfills.js";
/**
 * Sets up prototype methods on Address constructor
 *
 * @param {Function} Address - Address constructor function
 */
export function setupPrototype(Address) {
    // Set up Address.prototype to inherit from Uint8Array.prototype
    Object.setPrototypeOf(Address.prototype, Uint8Array.prototype);
    // Instance methods
    Address.prototype.toBase64 =
        Uint8Array.prototype.toBase64 ?? toBase64Polyfill;
    Address.prototype.setFromBase64 =
        Uint8Array.prototype.setFromBase64 ?? setFromBase64Polyfill;
    Address.prototype.toHex = BrandedAddress.toHex.call.bind(BrandedAddress.toHex);
    Address.prototype.setFromHex =
        Uint8Array.prototype.setFromHex ?? setFromHexPolyfill;
    Address.prototype.toChecksummed = BrandedAddress.toChecksummed.call.bind(BrandedAddress.toChecksummed);
    Address.prototype.toLowercase = BrandedAddress.toLowercase.call.bind(BrandedAddress.toLowercase);
    Address.prototype.toUppercase = BrandedAddress.toUppercase.call.bind(BrandedAddress.toUppercase);
    Address.prototype.toU256 = BrandedAddress.toU256.call.bind(BrandedAddress.toU256);
    Address.prototype.toAbiEncoded = BrandedAddress.toAbiEncoded.call.bind(BrandedAddress.toAbiEncoded);
    Address.prototype.toShortHex = BrandedAddress.toShortHex.call.bind(BrandedAddress.toShortHex);
    Address.prototype.compare = BrandedAddress.compare.call.bind(BrandedAddress.compare);
    Address.prototype.lessThan = BrandedAddress.lessThan.call.bind(BrandedAddress.lessThan);
    Address.prototype.greaterThan = BrandedAddress.greaterThan.call.bind(BrandedAddress.greaterThan);
    Address.prototype.isZero = BrandedAddress.isZero.call.bind(BrandedAddress.isZero);
    Address.prototype.equals = BrandedAddress.equals.call.bind(BrandedAddress.equals);
    Address.prototype.toBytes = BrandedAddress.toBytes.call.bind(BrandedAddress.toBytes);
    Address.prototype.clone = function () {
        const result = BrandedAddress.clone(
        /** @type {import('./AddressType.js').AddressType} */ (
        /** @type {unknown} */ (this)));
        Object.setPrototypeOf(result, Address.prototype);
        return result;
    };
    /**
     * Instance method to calculate CREATE contract address from this address
     *
     * @see https://voltaire.tevm.sh/primitives/address for Address documentation
     * @since 0.0.0
     * @this {import('./AddressType.js').AddressType}
     * @param {bigint} nonce - Account nonce at deployment
     * @returns {import('./AddressType.js').AddressType} Computed contract address
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
        /** @type {import('./AddressType.js').AddressType} */ (this), nonce);
        Object.setPrototypeOf(result, Address.prototype);
        return result;
    };
    /**
     * Instance method to calculate CREATE2 contract address from this address
     *
     * @see https://voltaire.tevm.sh/primitives/address for Address documentation
     * @since 0.0.0
     * @this {import('./AddressType.js').AddressType}
     * @param {bigint | Uint8Array} salt - 32-byte salt value
     * @param {Uint8Array} initCode - Contract initialization code
     * @returns {import('./AddressType.js').AddressType} Computed contract address
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
        /** @type {import('./AddressType.js').AddressType} */ (this), 
        /** @type {*} */ (salt), 
        /** @type {*} */ (initCode));
        Object.setPrototypeOf(result, Address.prototype);
        return result;
    };
    /**
     * Custom Node.js inspect formatter for Address instances
     *
     * @see https://voltaire.tevm.sh/primitives/address for Address documentation
     * @since 0.0.0
     * @this {import('./AddressType.js').AddressType}
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
    Address.prototype[Symbol.for("nodejs.util.inspect.custom")] = function (_depth, _options) {
        return `Address(${BrandedAddress.toChecksummed(
        /** @type {import('./AddressType.js').AddressType} */ (this))})`;
    };
    /**
     * Converts Address to string representation
     *
     * @see https://voltaire.tevm.sh/primitives/address for Address documentation
     * @since 0.0.0
     * @this {import('./AddressType.js').AddressType}
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
        /** @type {import('./AddressType.js').AddressType} */ (this))})`;
    };
}

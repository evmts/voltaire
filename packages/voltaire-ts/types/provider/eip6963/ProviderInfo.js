/**
 * ProviderInfo constructor
 *
 * Creates a validated, branded, frozen ProviderInfo object.
 *
 * @module provider/eip6963/ProviderInfo
 */
import { brand } from "../../brand.js";
import { validateIcon, validateName, validateRdns, validateUuid, } from "./validators.js";
/**
 * Create a validated ProviderInfo object
 *
 * Validates all fields and returns a frozen, branded object.
 *
 * @param {import('./types.js').ProviderInfoInput} input - Provider info fields
 * @returns {import('./types.js').ProviderInfoType} Frozen, branded ProviderInfo
 * @throws {MissingFieldError} If any required field is missing
 * @throws {InvalidUuidError} If uuid is not valid UUIDv4
 * @throws {InvalidRdnsError} If rdns is not valid reverse DNS
 * @throws {InvalidIconError} If icon is not valid data URI
 * @throws {InvalidFieldError} If name is empty
 *
 * @example
 * ```typescript
 * import * as EIP6963 from '@voltaire/provider/eip6963';
 *
 * const info = EIP6963.ProviderInfo({
 *   uuid: "350670db-19fa-4704-a166-e52e178b59d2",
 *   name: "Example Wallet",
 *   icon: "data:image/svg+xml;base64,PHN2Zy...",
 *   rdns: "com.example.wallet"
 * });
 *
 * console.log(info.name); // "Example Wallet"
 * console.log(Object.isFrozen(info)); // true
 * ```
 */
export function ProviderInfo(input) {
    // Validate all fields
    validateUuid(input.uuid);
    validateName(input.name);
    validateIcon(input.icon);
    validateRdns(input.rdns);
    // Create branded object
    const result = /** @type {import('./types.js').ProviderInfoType} */ ({
        uuid: input.uuid,
        name: input.name,
        icon: input.icon,
        rdns: input.rdns,
    });
    // Apply brand
    Object.defineProperty(result, brand, {
        value: "ProviderInfo",
        enumerable: false,
        writable: false,
        configurable: false,
    });
    // Freeze and return
    return Object.freeze(result);
}

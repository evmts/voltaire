/**
 * Validate UUID is UUIDv4 format
 *
 * @param {string} uuid - The UUID to validate
 * @throws {MissingFieldError} If uuid is missing
 * @throws {InvalidUuidError} If uuid is not valid UUIDv4
 *
 * @example
 * ```typescript
 * validateUuid("350670db-19fa-4704-a166-e52e178b59d2"); // OK
 * validateUuid("invalid"); // Throws InvalidUuidError
 * ```
 */
export function validateUuid(uuid: string): void;
/**
 * Validate RDNS is valid reverse DNS format
 *
 * @param {string} rdns - The reverse DNS to validate
 * @throws {MissingFieldError} If rdns is missing
 * @throws {InvalidRdnsError} If rdns is not valid format
 *
 * @example
 * ```typescript
 * validateRdns("io.metamask"); // OK
 * validateRdns("metamask"); // Throws InvalidRdnsError
 * ```
 */
export function validateRdns(rdns: string): void;
/**
 * Validate icon is a valid data URI
 *
 * @param {string} icon - The icon data URI to validate
 * @throws {MissingFieldError} If icon is missing
 * @throws {InvalidIconError} If icon is not a valid data URI
 *
 * @example
 * ```typescript
 * validateIcon("data:image/svg+xml;base64,PHN2Zy..."); // OK
 * validateIcon("https://example.com/icon.png"); // Throws InvalidIconError
 * ```
 */
export function validateIcon(icon: string): void;
/**
 * Validate provider has request method
 *
 * @param {unknown} provider - The provider to validate
 * @throws {MissingFieldError} If provider is missing
 * @throws {InvalidProviderError} If provider.request is not a function
 *
 * @example
 * ```typescript
 * validateProvider(window.ethereum); // OK if has request()
 * validateProvider({}); // Throws InvalidProviderError
 * ```
 */
export function validateProvider(provider: unknown): void;
/**
 * Validate name is non-empty string
 *
 * @param {string} name - The name to validate
 * @throws {MissingFieldError} If name is missing
 * @throws {InvalidFieldError} If name is empty
 */
export function validateName(name: string): void;
/**
 * UUIDv4 format regex
 * @type {RegExp}
 */
export const UUID_V4_REGEX: RegExp;
/**
 * Reverse DNS format regex
 * @type {RegExp}
 */
export const RDNS_REGEX: RegExp;
/**
 * Data URI format regex for images
 * @type {RegExp}
 */
export const DATA_URI_REGEX: RegExp;
//# sourceMappingURL=validators.d.ts.map
/**
 * Validation functions for EIP-6963
 *
 * @module provider/eip6963/validators
 */

import {
	InvalidFieldError,
	InvalidIconError,
	InvalidProviderError,
	InvalidRdnsError,
	InvalidUuidError,
	MissingFieldError,
} from "./errors.js";

/**
 * UUIDv4 format regex
 * @type {RegExp}
 */
export const UUID_V4_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Reverse DNS format regex
 * @type {RegExp}
 */
export const RDNS_REGEX = /^[a-z0-9]+(\.[a-z0-9-]+)+$/i;

/**
 * Data URI format regex for images
 * @type {RegExp}
 */
export const DATA_URI_REGEX =
	/^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,/;

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
export function validateUuid(uuid) {
	if (uuid === undefined || uuid === null) {
		throw new MissingFieldError("ProviderInfo", "uuid");
	}
	if (typeof uuid !== "string") {
		throw new InvalidFieldError("ProviderInfo", "uuid", "must be a string");
	}
	if (!UUID_V4_REGEX.test(uuid)) {
		throw new InvalidUuidError(uuid);
	}
}

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
export function validateRdns(rdns) {
	if (rdns === undefined || rdns === null) {
		throw new MissingFieldError("ProviderInfo", "rdns");
	}
	if (typeof rdns !== "string") {
		throw new InvalidFieldError("ProviderInfo", "rdns", "must be a string");
	}
	if (!RDNS_REGEX.test(rdns)) {
		throw new InvalidRdnsError(rdns);
	}
}

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
export function validateIcon(icon) {
	if (icon === undefined || icon === null) {
		throw new MissingFieldError("ProviderInfo", "icon");
	}
	if (typeof icon !== "string") {
		throw new InvalidFieldError("ProviderInfo", "icon", "must be a string");
	}
	if (!DATA_URI_REGEX.test(icon)) {
		throw new InvalidIconError(icon);
	}
}

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
export function validateProvider(provider) {
	if (provider === undefined || provider === null) {
		throw new MissingFieldError("ProviderDetail", "provider");
	}
	if (
		typeof provider !== "object" ||
		typeof (/** @type {any} */ (provider).request) !== "function"
	) {
		throw new InvalidProviderError();
	}
}

/**
 * Validate name is non-empty string
 *
 * @param {string} name - The name to validate
 * @throws {MissingFieldError} If name is missing
 * @throws {InvalidFieldError} If name is empty
 */
export function validateName(name) {
	if (name === undefined || name === null) {
		throw new MissingFieldError("ProviderInfo", "name");
	}
	if (typeof name !== "string") {
		throw new InvalidFieldError("ProviderInfo", "name", "must be a string");
	}
	if (name.trim() === "") {
		throw new InvalidFieldError("ProviderInfo", "name", "cannot be empty");
	}
}

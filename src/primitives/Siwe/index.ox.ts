/**
 * Siwe Module - Ox-based Implementation
 *
 * This module provides Sign-In with Ethereum (EIP-4361) message creation, parsing, and validation.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 */

// ============================================================================
// Ox Re-exports (Core Functionality)
// ============================================================================

export {
	// Constructors
	createMessage,
	// Parsers
	parseMessage,
	// Validators
	validateMessage,
	// Utilities
	generateNonce,
	isUri,
	// Regex patterns for validation
	domainRegex,
	ipRegex,
	localhostRegex,
	nonceRegex,
	prefixRegex,
	schemeRegex,
	suffixRegex,
	// Errors
	InvalidMessageFieldError,
	// Types
	type Message as SiweMessage,
} from "ox/Siwe";

// ============================================================================
// Compatibility Aliases (Minor naming differences)
// ============================================================================

// Ox uses `createMessage`, provide alias for backwards compatibility
export { createMessage as create } from "ox/Siwe";

// Ox uses `parseMessage`, provide alias for backwards compatibility
export { parseMessage as parse } from "ox/Siwe";

// Ox uses `validateMessage`, provide alias for backwards compatibility
export { validateMessage as validate } from "ox/Siwe";

// Ox uses `isUri`, provide alias for URI validation
export { isUri as validateUri } from "ox/Siwe";

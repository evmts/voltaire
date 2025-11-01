/**
 * Sign-In with Ethereum (EIP-4361) Types and Utilities
 *
 * Structured message format for authentication using Ethereum accounts.
 *
 * @example
 * ```typescript
 * import * as Siwe from './siwe.js';
 *
 * // Create message
 * const message: Siwe.Message = {
 *   domain: "example.com",
 *   address: "0x...",
 *   uri: "https://example.com",
 *   version: "1",
 *   chainId: 1,
 *   nonce: Siwe.generateNonce(),
 *   issuedAt: new Date().toISOString(),
 * };
 *
 * // Format for signing
 * const text = Siwe.format(message);
 * const richMessage = attach(message, { format: Siwe.Message.format });
 * const text2 = richMessage.format();
 *
 * // Parse from text
 * const parsed = Siwe.parse(text);
 *
 * // Verify signature
 * const valid = Siwe.verify(message, signature);
 * ```
 */

import * as Address from "../Address/index.js";
import { Keccak256 } from "../../crypto/keccak256.js";
import { Secp256k1 } from "../../crypto/secp256k1.js";
import type { Hash } from "../Hash/index.js";

export type { Address };

// ============================================================================
// Core Types
// ============================================================================

/**
 * Sign-In with Ethereum Message (EIP-4361)
 *
 * A structured message format for authentication using Ethereum accounts.
 * Supports domains, URIs, nonces, timestamps, and optional resources.
 */
export type Message<
    TDomain extends string = string,
    TAddress extends Address.Address = Address.Address,
    TUri extends string = string,
    TVersion extends string = string,
    TChainId extends number = number,
  > = {
    /** RFC 4501 dns authority that is requesting the signing */
    domain: TDomain;
    /** Ethereum address performing the signing */
    address: TAddress;
    /** Human-readable ASCII assertion that the user will sign (optional) */
    statement?: string;
    /** RFC 3986 URI referring to the resource that is the subject of the signing */
    uri: TUri;
    /** Current version of the message (must be "1") */
    version: TVersion;
    /** EIP-155 Chain ID to which the session is bound */
    chainId: TChainId;
    /** Randomized token to prevent replay attacks, at least 8 alphanumeric characters */
    nonce: string;
    /** ISO 8601 datetime string of the current time */
    issuedAt: string;
    /** ISO 8601 datetime string after which the message is no longer valid (optional) */
    expirationTime?: string;
    /** ISO 8601 datetime string before which the message is invalid (optional) */
    notBefore?: string;
    /** System-specific identifier that may be used to uniquely refer to the sign-in request (optional) */
    requestId?: string;
    /** List of information or references to information the user wishes to have resolved (optional) */
    resources?: string[];
  };

/**
 * Signature type for SIWE verification
 * 65 bytes: r (32) + s (32) + v (1)
 */
export type Signature = Uint8Array;

/**
 * Validation result with detailed error information
 */
export type ValidationResult =
  | { valid: true }
  | { valid: false; error: ValidationError };

/**
 * Validation error types
 */
export type ValidationError =
  | { type: "invalid_domain"; message: string }
  | { type: "invalid_address"; message: string }
  | { type: "invalid_uri"; message: string }
  | { type: "invalid_version"; message: string }
  | { type: "invalid_chain_id"; message: string }
  | { type: "invalid_nonce"; message: string }
  | { type: "invalid_timestamp"; message: string }
  | { type: "expired"; message: string }
  | { type: "not_yet_valid"; message: string }
  | { type: "signature_mismatch"; message: string };

// ============================================================================
// Message Operations
// ============================================================================

export namespace Message {
  /**
   * Format a SIWE message into a string for signing (standard form)
   *
   * @param message - SiweMessage to format
   * @returns Formatted string according to EIP-4361 specification
   *
   * @example
   * ```typescript
   * const message: Message = {
   *   domain: "example.com",
   *   address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
   *   uri: "https://example.com",
   *   version: "1",
   *   chainId: 1,
   *   nonce: "32891756",
   *   issuedAt: "2021-09-30T16:25:24Z",
   * };
   *
   * const text = Message.format(message);
   * ```
   */
  export function format<T extends Message>(message: T): string {
    const lines: string[] = [];

    // Header: domain + address
    lines.push(`${message.domain} wants you to sign in with your Ethereum account:`);
    // Convert address bytes to hex string for display
    const addressHex = "0x" + Array.from(message.address)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    lines.push(addressHex);
    lines.push("");

    // Optional statement
    if (message.statement) {
      lines.push(message.statement);
      lines.push("");
    }

    // Required fields
    lines.push(`URI: ${message.uri}`);
    lines.push(`Version: ${message.version}`);
    lines.push(`Chain ID: ${message.chainId}`);
    lines.push(`Nonce: ${message.nonce}`);
    lines.push(`Issued At: ${message.issuedAt}`);

    // Optional fields
    if (message.expirationTime) {
      lines.push(`Expiration Time: ${message.expirationTime}`);
    }
    if (message.notBefore) {
      lines.push(`Not Before: ${message.notBefore}`);
    }
    if (message.requestId) {
      lines.push(`Request ID: ${message.requestId}`);
    }
    if (message.resources && message.resources.length > 0) {
      lines.push("Resources:");
      for (const resource of message.resources) {
        lines.push(`- ${resource}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Validate a SIWE message structure and timestamps (standard form)
   *
   * @param message - Message to validate
   * @param options - Validation options (current time for timestamp checks)
   * @returns Validation result with error details if invalid
   *
   * @example
   * ```typescript
   * const result = Message.validate(message);
   * if (!result.valid) {
   *   console.error(result.error.message);
   * }
   * ```
   */
  export function validate<T extends Message>(
    message: T,
    options?: { now?: Date },
  ): ValidationResult {
    // Domain validation
    if (!message.domain || message.domain.length === 0) {
      return {
        valid: false,
        error: { type: "invalid_domain", message: "Domain is required" },
      };
    }

    // Address validation (check it's a proper Uint8Array with 20 bytes)
    if (!message.address || !(message.address instanceof Uint8Array) || message.address.length !== 20) {
      return {
        valid: false,
        error: { type: "invalid_address", message: "Invalid Ethereum address format" },
      };
    }

    // URI validation
    if (!message.uri) {
      return {
        valid: false,
        error: { type: "invalid_uri", message: "URI is required" },
      };
    }

    // Version validation
    if (message.version !== "1") {
      return {
        valid: false,
        error: {
          type: "invalid_version",
          message: `Invalid version: expected "1", got "${message.version}"`,
        },
      };
    }

    // Chain ID validation
    if (!Number.isInteger(message.chainId) || message.chainId < 1) {
      return {
        valid: false,
        error: { type: "invalid_chain_id", message: "Chain ID must be a positive integer" },
      };
    }

    // Nonce validation
    if (!message.nonce || message.nonce.length < 8) {
      return {
        valid: false,
        error: {
          type: "invalid_nonce",
          message: "Nonce must be at least 8 characters",
        },
      };
    }

    // Timestamp validation
    const now = options?.now || new Date();

    try {
      const issuedAt = new Date(message.issuedAt);
      if (isNaN(issuedAt.getTime())) {
        return {
          valid: false,
          error: { type: "invalid_timestamp", message: "Invalid issuedAt timestamp" },
        };
      }

      if (message.expirationTime) {
        const expirationTime = new Date(message.expirationTime);
        if (isNaN(expirationTime.getTime())) {
          return {
            valid: false,
            error: { type: "invalid_timestamp", message: "Invalid expirationTime timestamp" },
          };
        }
        if (now >= expirationTime) {
          return {
            valid: false,
            error: { type: "expired", message: "Message has expired" },
          };
        }
      }

      if (message.notBefore) {
        const notBefore = new Date(message.notBefore);
        if (isNaN(notBefore.getTime())) {
          return {
            valid: false,
            error: { type: "invalid_timestamp", message: "Invalid notBefore timestamp" },
          };
        }
        if (now < notBefore) {
          return {
            valid: false,
            error: { type: "not_yet_valid", message: "Message is not yet valid" },
          };
        }
      }
    } catch (e) {
      return {
        valid: false,
        error: {
          type: "invalid_timestamp",
          message: `Timestamp parsing error: ${e instanceof Error ? e.message : String(e)}`,
        },
      };
    }

    return { valid: true };
  }

  /**
   * Get the EIP-191 personal sign message hash (standard form)
   *
   * @param message - Message to hash
   * @returns Message hash ready for signing with EIP-191 prefix
   *
   * @example
   * ```typescript
   * const hash = Message.getMessageHash(message);
   * // Returns hash with "\x19Ethereum Signed Message:\n" prefix
   * ```
   */
  export function getMessageHash<T extends Message>(message: T): Uint8Array {
    // Format the message to text
    const messageText = format(message);

    // Create EIP-191 personal sign prefix: "\x19Ethereum Signed Message:\n{length}"
    const messageBytes = new TextEncoder().encode(messageText);
    const lengthString = messageBytes.length.toString();
    const lengthBytes = new TextEncoder().encode(lengthString);

    // Build the full message: prefix + length + message
    const prefix = new Uint8Array([0x19]); // "\x19"
    const ethSignedMessage = new TextEncoder().encode("Ethereum Signed Message:\n");

    const fullMessage = new Uint8Array(
      prefix.length + ethSignedMessage.length + lengthBytes.length + messageBytes.length
    );

    let offset = 0;
    fullMessage.set(prefix, offset);
    offset += prefix.length;
    fullMessage.set(ethSignedMessage, offset);
    offset += ethSignedMessage.length;
    fullMessage.set(lengthBytes, offset);
    offset += lengthBytes.length;
    fullMessage.set(messageBytes, offset);

    // Hash with keccak256
    return Keccak256.hash(fullMessage);
  }

  /**
   * Verify a SIWE message signature (standard form)
   *
   * @param message - The SIWE message that was signed
   * @param signature - The signature to verify (65 bytes: r, s, v)
   * @returns true if signature is valid and matches message address
   *
   * @example
   * ```typescript
   * const valid = Message.verify(message, signature);
   * if (valid) {
   *   // Signature is valid, user is authenticated
   * }
   * ```
   */
  export function verify<T extends Message>(
    message: T,
    signature: Signature,
  ): boolean {
    // Validate message structure
    const validationResult = validate(message);
    if (!validationResult.valid) {
      return false;
    }

    // Get message hash
    const messageHash = getMessageHash(message);

    // Signature is 65 bytes: r (32) + s (32) + v (1)
    if (signature.length !== 65) {
      return false;
    }

    const r = signature.slice(0, 32);
    const s = signature.slice(32, 64);
    const v = signature[64];

    if (v === undefined) {
      return false;
    }

    // Normalize v to recovery id (0 or 1)
    let recoveryId: number;
    if (v >= 27) {
      recoveryId = v - 27;
    } else {
      recoveryId = v;
    }

    if (recoveryId !== 0 && recoveryId !== 1) {
      return false;
    }

    try {
      // Recover public key from signature
      const publicKey = Secp256k1.recoverPublicKey(
        { r, s, v: recoveryId },
        messageHash as Hash
      );

      // Derive address from public key
      let x = 0n;
      let y = 0n;
      for (let i = 0; i < 32; i++) {
        const xByte = publicKey[i];
        const yByte = publicKey[32 + i];
        if (xByte !== undefined && yByte !== undefined) {
          x = (x << 8n) | BigInt(xByte);
          y = (y << 8n) | BigInt(yByte);
        }
      }
      const recoveredAddress = Address.fromPublicKey(x, y);

      // Compare with message address
      if (recoveredAddress.length !== message.address.length) {
        return false;
      }
      for (let i = 0; i < recoveredAddress.length; i++) {
        if (recoveredAddress[i] !== message.address[i]) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Convenience Methods with this: parameter
// ============================================================================

/**
 * Format message to string (convenience form with this:)
 *
 * @example
 * ```typescript
 * const message: Message = { ... };
 * const richMessage = attach(message, { format });
 * const text = richMessage.format();
 * ```
 */
export function format<T extends Message>(this: T): string {
  return Message.format(this);
}

/**
 * Validate message (convenience form with this:)
 *
 * @example
 * ```typescript
 * const message: Message = { ... };
 * const richMessage = attach(message, { validate });
 * const result = richMessage.validate();
 * ```
 */
export function validate<T extends Message>(
  this: T,
  options?: { now?: Date },
): ValidationResult {
  return Message.validate(this, options);
}

/**
 * Get message hash (convenience form with this:)
 *
 * @example
 * ```typescript
 * const message: Message = { ... };
 * const richMessage = attach(message, { getMessageHash });
 * const hash = richMessage.getMessageHash();
 * ```
 */
export function getMessageHash<T extends Message>(this: T): Uint8Array {
  return Message.getMessageHash(this);
}

/**
 * Verify signature (convenience form with this:)
 *
 * @example
 * ```typescript
 * const message: Message = { ... };
 * const richMessage = attach(message, { verify });
 * const valid = richMessage.verify(signature);
 * ```
 */
export function verify<T extends Message>(
  this: T,
  signature: Signature,
): boolean {
  return Message.verify(this, signature);
}

// ============================================================================
// Parsing Operations
// ============================================================================

/**
 * Parse a SIWE message from a formatted string
 *
 * @param text - Formatted SIWE message string
 * @returns Parsed Message object
 * @throws Error if message format is invalid
 *
 * @example
 * ```typescript
 * const text = `example.com wants you to sign in with your Ethereum account:
 * 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
 *
 * Sign in to Example
 *
 * URI: https://example.com
 * Version: 1
 * Chain ID: 1
 * Nonce: 32891756
 * Issued At: 2021-09-30T16:25:24Z`;
 *
 * const message = parse(text);
 * ```
 */
export function parse(text: string): Message {
  const lines = text.split("\n");
  let lineIndex = 0;

  // Parse header
  const headerMatch = lines[lineIndex]?.match(
    /^(.+) wants you to sign in with your Ethereum account:$/,
  );
  if (!headerMatch || !headerMatch[1]) {
    throw new Error("Invalid SIWE message: missing domain header");
  }
  const domain: string = headerMatch[1];
  lineIndex++;

  // Parse address (hex string)
  const addressHex = lines[lineIndex]?.trim();
  if (!addressHex || !/^0x[0-9a-fA-F]{40}$/i.test(addressHex)) {
    throw new Error("Invalid SIWE message: missing or invalid address");
  }

  // Convert hex string to Uint8Array (Address type)
  const addressBytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    addressBytes[i] = parseInt(addressHex.slice(2 + i * 2, 4 + i * 2), 16);
  }
  const address = addressBytes as Address.Address;
  lineIndex++;

  // Skip empty line
  if (lines[lineIndex]?.trim() === "") {
    lineIndex++;
  }

  // Parse optional statement (lines until next empty line or field)
  let statement: string | undefined;
  const statementLines: string[] = [];
  while (
    lineIndex < lines.length &&
    lines[lineIndex]?.trim() !== "" &&
    !lines[lineIndex]?.includes(":")
  ) {
    const line = lines[lineIndex];
    if (line) {
      statementLines.push(line);
    }
    lineIndex++;
  }
  if (statementLines.length > 0) {
    statement = statementLines.join("\n");
  }

  // Skip empty line before fields
  if (lines[lineIndex]?.trim() === "") {
    lineIndex++;
  }

  // Parse required and optional fields
  const fields: Record<string, string> = {};
  const resources: string[] = [];
  let inResources = false;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    if (line === "Resources:") {
      inResources = true;
      lineIndex++;
      continue;
    }

    if (inResources) {
      const resourceMatch = line?.match(/^-\s*(.+)$/);
      if (resourceMatch) {
        const resource = resourceMatch[1];
        if (resource) {
          resources.push(resource);
        }
      }
      lineIndex++;
      continue;
    }

    const fieldMatch = line?.match(/^([^:]+):\s*(.+)$/);
    if (fieldMatch) {
      const key = fieldMatch[1];
      const value = fieldMatch[2];
      if (key && value) {
        fields[key] = value;
      }
    }
    lineIndex++;
  }

  // Extract and validate required fields
  const uri = fields["URI"];
  const version = fields["Version"];
  const chainIdStr = fields["Chain ID"];
  const nonce = fields["Nonce"];
  const issuedAt = fields["Issued At"];

  if (!uri || !version || !chainIdStr || !nonce || !issuedAt) {
    throw new Error(
      "Invalid SIWE message: missing required fields (URI, Version, Chain ID, Nonce, Issued At)",
    );
  }

  // After the check above, we know these are non-null strings
  const validatedUri: string = uri;
  const validatedVersion: string = version;
  const validatedNonce: string = nonce;
  const validatedIssuedAt: string = issuedAt;

  const chainId = parseInt(chainIdStr, 10);
  if (isNaN(chainId)) {
    throw new Error("Invalid SIWE message: Chain ID must be a number");
  }

  // Build message with proper optional property handling
  const message: Message = {
    domain,
    address,
    uri: validatedUri,
    version: validatedVersion,
    chainId,
    nonce: validatedNonce,
    issuedAt: validatedIssuedAt,
    ...(statement ? { statement } : {}),
    ...(fields["Expiration Time"] ? { expirationTime: fields["Expiration Time"] } : {}),
    ...(fields["Not Before"] ? { notBefore: fields["Not Before"] } : {}),
    ...(fields["Request ID"] ? { requestId: fields["Request ID"] } : {}),
    ...(resources.length > 0 ? { resources } : {}),
  };

  return message;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a cryptographically secure random nonce for SIWE messages
 *
 * @param length - Length of nonce (minimum 8, default 11)
 * @returns Random alphanumeric nonce string
 *
 * @example
 * ```typescript
 * const nonce = generateNonce();
 * // Returns something like "a7b9c2d4e6f"
 *
 * const longNonce = generateNonce(16);
 * // Returns something like "a7b9c2d4e6f8g0h1"
 * ```
 */
export function generateNonce(length: number = 11): string {
  if (length < 8) {
    throw new Error("Nonce length must be at least 8 characters");
  }

  // Use base62 alphanumeric characters (0-9, a-z, A-Z)
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const randomBytes = new Uint8Array(length);

  // Use crypto.getRandomValues for secure randomness
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for Node.js environment
    const nodeCrypto = require("crypto");
    nodeCrypto.randomFillSync(randomBytes);
  }

  let nonce = "";
  for (let i = 0; i < length; i++) {
    const byte = randomBytes[i];
    if (byte !== undefined) {
      nonce += chars[byte % chars.length];
    }
  }

  return nonce;
}

/**
 * Create a new SIWE message with default values
 *
 * @param params - Message parameters (domain, address, uri, chainId are required)
 * @returns New SIWE message with defaults
 *
 * @example
 * ```typescript
 * const message = create({
 *   domain: "example.com",
 *   address: "0x...",
 *   uri: "https://example.com",
 *   chainId: 1,
 * });
 * // Automatically generates nonce, issuedAt, and sets version to "1"
 * ```
 */
export function create<
  TDomain extends string,
  TAddress extends Address.Address,
  TUri extends string,
  TChainId extends number,
>(params: {
  domain: TDomain;
  address: TAddress;
  uri: TUri;
  chainId: TChainId;
  statement?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
  nonce?: string;
  issuedAt?: string;
}): Message<TDomain, TAddress, TUri, "1", TChainId> {
  return {
    domain: params.domain,
    address: params.address,
    uri: params.uri,
    version: "1" as const,
    chainId: params.chainId,
    nonce: params.nonce || generateNonce(),
    issuedAt: params.issuedAt || new Date().toISOString(),
    ...(params.statement ? { statement: params.statement } : {}),
    ...(params.expirationTime ? { expirationTime: params.expirationTime } : {}),
    ...(params.notBefore ? { notBefore: params.notBefore } : {}),
    ...(params.requestId ? { requestId: params.requestId } : {}),
    ...(params.resources ? { resources: params.resources } : {}),
  };
}

/**
 * Verify both message validity and signature
 *
 * Convenience method that combines validation and signature verification.
 *
 * @param message - The SIWE message to verify
 * @param signature - The signature to verify
 * @param options - Validation options
 * @returns Validation result with signature verification
 *
 * @example
 * ```typescript
 * const result = verifyMessage(message, signature);
 * if (result.valid) {
 *   // Message structure and signature are both valid
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function verifyMessage<T extends Message>(
  message: T,
  signature: Signature,
  options?: { now?: Date },
): ValidationResult {
  // First validate message structure
  const validationResult = Message.validate(message, options);
  if (!validationResult.valid) {
    return validationResult;
  }

  // Then verify signature
  try {
    const signatureValid = Message.verify(message, signature);
    if (!signatureValid) {
      return {
        valid: false,
        error: {
          type: "signature_mismatch",
          message: "Signature does not match message address",
        },
      };
    }
  } catch (e) {
    return {
      valid: false,
      error: {
        type: "signature_mismatch",
        message: `Signature verification failed: ${e instanceof Error ? e.message : String(e)}`,
      },
    };
  }

  return { valid: true };
}

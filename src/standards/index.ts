/**
 * Ethereum Token Standards (ERC Standards)
 *
 * This module provides low-level interfaces for Ethereum token standards:
 * - ERC-20: Fungible tokens
 * - ERC-721: Non-fungible tokens (NFTs)
 * - ERC-1155: Multi-token standard
 * - ERC-165: Interface detection
 *
 * Each standard exports:
 * - Function selectors (first 4 bytes of keccak256 of signature)
 * - Event signatures (keccak256 of event signature)
 * - Encoding helpers for calldata
 * - Decoding helpers for return values and events
 */

export * as ERC20 from "./ERC20.js";
export * as ERC721 from "./ERC721.js";
export * as ERC1155 from "./ERC1155.js";
export * as ERC165 from "./ERC165.js";

/**
 * Block context opcode handlers (0x40-0x4a)
 *
 * These opcodes access block-level information like timestamp, number, coinbase, etc.
 * Most require access to block context which will be provided via EVM/Host interface.
 *
 * Current implementations are stubbed with frame properties until full integration.
 */

export { handler_0x40_BLOCKHASH } from "./0x40_BLOCKHASH.js";
export { handler_0x41_COINBASE } from "./0x41_COINBASE.js";
export { handler_0x42_TIMESTAMP } from "./0x42_TIMESTAMP.js";
export { handler_0x43_NUMBER } from "./0x43_NUMBER.js";
export { handler_0x44_DIFFICULTY } from "./0x44_DIFFICULTY.js";
export { handler_0x45_GASLIMIT } from "./0x45_GASLIMIT.js";
export { handler_0x46_CHAINID } from "./0x46_CHAINID.js";
export { handler_0x47_SELFBALANCE } from "./0x47_SELFBALANCE.js";
export { handler_0x48_BASEFEE } from "./0x48_BASEFEE.js";
export { handler_0x49_BLOBHASH } from "./0x49_BLOBHASH.js";
export { handler_0x4a_BLOBBASEFEE } from "./0x4a_BLOBBASEFEE.js";

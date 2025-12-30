import type { brand } from "../../brand.js";
import type { AddressType as Address } from "../../primitives/Address/AddressType.js";
import type { CallParams, CallResult, CreateParams, CreateResult } from "../InstructionHandlerType.js";

/**
 * BrandedHost - EVM host interface for external state access
 *
 * Provides access to account state (balances, storage, code, nonces) and
 * nested execution capabilities.
 *
 * ## Architecture Note
 *
 * This module provides low-level EVM primitives (opcode handlers, frame management).
 * For full EVM execution with nested calls, use:
 *
 * - **guillotine**: Production EVM with async state access, tracing, and full EIP support
 * - **guillotine-mini**: Lightweight synchronous EVM for testing and simple use cases
 *
 * The `call` and `create` methods on this interface are optional - when not provided,
 * system opcodes (CALL, CREATE, etc.) will return a NotImplemented error. This is
 * intentional: these low-level utils don't include a full execution engine.
 *
 * Based on guillotine-mini HostInterface vtable pattern.
 */
export type BrandedHost = {
	readonly [brand]: "Host";

	/**
	 * Get account balance
	 */
	getBalance: (address: Address) => bigint;

	/**
	 * Set account balance
	 */
	setBalance: (address: Address, balance: bigint) => void;

	/**
	 * Get account code
	 */
	getCode: (address: Address) => Uint8Array;

	/**
	 * Set account code
	 */
	setCode: (address: Address, code: Uint8Array) => void;

	/**
	 * Get storage slot value
	 */
	getStorage: (address: Address, slot: bigint) => bigint;

	/**
	 * Set storage slot value
	 */
	setStorage: (address: Address, slot: bigint, value: bigint) => void;

	/**
	 * Get account nonce
	 */
	getNonce: (address: Address) => bigint;

	/**
	 * Set account nonce
	 */
	setNonce: (address: Address, nonce: bigint) => void;

	/**
	 * Get transient storage slot value (EIP-1153)
	 * Transaction-scoped, cleared at end of transaction
	 */
	getTransientStorage: (address: Address, slot: bigint) => bigint;

	/**
	 * Set transient storage slot value (EIP-1153)
	 * Transaction-scoped, cleared at end of transaction
	 */
	setTransientStorage: (address: Address, slot: bigint, value: bigint) => void;

	/**
	 * Execute a nested CALL operation (CALL, STATICCALL, DELEGATECALL, CALLCODE)
	 *
	 * Optional - when not provided, CALL-family opcodes return NotImplemented error.
	 * Full implementations provided by guillotine/guillotine-mini EVM engines.
	 */
	call?: (params: CallParams) => CallResult;

	/**
	 * Execute a nested CREATE operation (CREATE, CREATE2)
	 *
	 * Optional - when not provided, CREATE-family opcodes return NotImplemented error.
	 * Full implementations provided by guillotine/guillotine-mini EVM engines.
	 */
	create?: (params: CreateParams) => CreateResult;
};

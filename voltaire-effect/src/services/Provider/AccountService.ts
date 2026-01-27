/**
 * @fileoverview Account service definition for account-related JSON-RPC calls.
 *
 * @module AccountService
 * @since 0.3.0
 *
 * @description
 * The AccountService provides account state queries and optional RPC signing
 * operations (eth_sign, eth_signTransaction) when supported by the node.
 *
 * @see {@link ProviderService} - Combined convenience service
 */

import type { HexType } from "@tevm/voltaire/Hex";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type {
	AddressInput,
	BlockTag,
	GetBalanceError,
	GetCodeError,
	GetProofError,
	GetStorageAtError,
	GetTransactionCountError,
	HashInput,
	ProofType,
	RpcTransactionRequest,
	SignError,
	SignTransactionError,
} from "./ProviderService.js";

/**
 * Shape of the Account service.
 *
 * @since 0.3.0
 */
export type AccountShape = {
	/** Gets the balance of an address */
	readonly getBalance: (
		address: AddressInput,
		blockTag?: BlockTag,
	) => Effect.Effect<bigint, GetBalanceError>;
	/** Gets the transaction count (nonce) for an address */
	readonly getTransactionCount: (
		address: AddressInput,
		blockTag?: BlockTag,
	) => Effect.Effect<bigint, GetTransactionCountError>;
	/** Gets the bytecode at an address */
	readonly getCode: (
		address: AddressInput,
		blockTag?: BlockTag,
	) => Effect.Effect<HexType | `0x${string}`, GetCodeError>;
	/** Gets storage at a specific slot */
	readonly getStorageAt: (
		address: AddressInput,
		slot: HashInput,
		blockTag?: BlockTag,
	) => Effect.Effect<HexType | `0x${string}`, GetStorageAtError>;
	/** Gets Merkle-Patricia proof for an account and storage slots */
	readonly getProof: (
		address: AddressInput,
		storageKeys: (HashInput | `0x${string}`)[],
		blockTag?: BlockTag,
	) => Effect.Effect<ProofType, GetProofError>;
	/** Signs arbitrary data with an unlocked account (if supported) */
	readonly sign?: (
		address: AddressInput,
		message: HexType | `0x${string}`,
	) => Effect.Effect<`0x${string}`, SignError>;
	/** Signs a transaction with an unlocked account (if supported) */
	readonly signTransaction?: (
		tx: RpcTransactionRequest,
	) => Effect.Effect<unknown, SignTransactionError>;
};

/**
 * Account service for account-related JSON-RPC operations.
 *
 * @since 0.3.0
 */
export class AccountService extends Context.Tag("AccountService")<
	AccountService,
	AccountShape
>() {}

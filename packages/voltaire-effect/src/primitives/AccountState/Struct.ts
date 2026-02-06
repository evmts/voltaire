/**
 * @fileoverview Effect Schema definitions for Ethereum account state.
 * Provides validation schemas for account nonce, balance, code hash, and storage root.
 * @module AccountState/AccountStateSchema
 * @since 0.0.1
 */

import { Uint } from "@tevm/voltaire";
import { Bytes32, type Bytes32Type } from "@tevm/voltaire/Bytes";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Represents the complete state of an Ethereum account.
 * Contains nonce, balance, code hash, and storage root fields.
 *
 * @description
 * An AccountState is the fundamental unit of state in the Ethereum state trie.
 * Each account has:
 * - nonce: Transaction count for EOAs or deployment count for contracts
 * - balance: Wei balance of the account
 * - codeHash: Keccak-256 hash of the account's bytecode (empty for EOAs)
 * - storageRoot: Root hash of the account's storage trie
 *
 * @example
 * ```typescript
 * import { AccountState } from 'voltaire-effect/primitives'
 *
 * const state: AccountStateType = {
 *   nonce: 5n,
 *   balance: 1000000000000000000n, // 1 ETH
 *   codeHash: EMPTY_CODE_HASH,
 *   storageRoot: EMPTY_STORAGE_ROOT,
 *   __tag: 'AccountState'
 * }
 * ```
 *
 * @since 0.0.1
 */
export interface AccountStateType {
	readonly nonce: bigint;
	readonly balance: bigint;
	readonly codeHash: Bytes32Type;
	readonly storageRoot: Bytes32Type;
	readonly __tag: "AccountState";
}

/**
 * Input format for creating an AccountState.
 * Accepts flexible input types that will be normalized during parsing.
 *
 * @description
 * This interface allows creating account states from various input formats:
 * - nonce/balance can be bigint, number, or string representations
 * - codeHash/storageRoot can be hex strings, Uint8Arrays, bigints, or numbers
 *
 * @example
 * ```typescript
 * const input: AccountStateInput = {
 *   nonce: '0',
 *   balance: '1000000000000000000',
 *   codeHash: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
 *   storageRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
 * }
 * ```
 *
 * @since 0.0.1
 */
interface AccountStateInput {
	nonce: bigint | number | string;
	balance: bigint | number | string;
	codeHash: string | Uint8Array | bigint | number;
	storageRoot: string | Uint8Array | bigint | number;
}

const AccountStateTypeSchema = S.declare<AccountStateType>(
	(u): u is AccountStateType => {
		if (typeof u !== "object" || u === null) return false;
		const obj = u as Record<string, unknown>;
		return (
			typeof obj.nonce === "bigint" &&
			obj.nonce >= 0n &&
			typeof obj.balance === "bigint" &&
			obj.balance >= 0n &&
			obj.codeHash instanceof Uint8Array &&
			obj.codeHash.length === 32 &&
			obj.storageRoot instanceof Uint8Array &&
			obj.storageRoot.length === 32
		);
	},
	{ identifier: "AccountState" },
);

const AccountStateInputSchema = S.Struct({
	nonce: S.Union(S.BigIntFromSelf, S.Number, S.String),
	balance: S.Union(S.BigIntFromSelf, S.Number, S.String),
	codeHash: S.Union(S.String, S.Uint8ArrayFromSelf, S.BigIntFromSelf, S.Number),
	storageRoot: S.Union(
		S.String,
		S.Uint8ArrayFromSelf,
		S.BigIntFromSelf,
		S.Number,
	),
});

/**
 * Effect Schema for validating and transforming account state data.
 *
 * @description
 * This schema transforms flexible input formats into a normalized AccountStateType.
 * It handles conversion of nonce/balance from strings/numbers to bigints, and
 * codeHash/storageRoot from various formats to Bytes32.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { AccountStateSchema } from 'voltaire-effect/primitives/AccountState'
 *
 * const parse = S.decodeSync(AccountStateSchema)
 * const state = parse({
 *   nonce: 0,
 *   balance: '1000000000000000000',
 *   codeHash: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
 *   storageRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
 * })
 * ```
 *
 * @throws {ParseError} When input values cannot be converted to valid account state
 *
 * @see {@link AccountStateType} for the output type
 * @see {@link from} for Effect-based creation
 *
 * @since 0.0.1
 */
export const AccountStateSchema: S.Schema<AccountStateType, AccountStateInput> =
	S.transformOrFail(AccountStateInputSchema, AccountStateTypeSchema, {
		strict: true,
		decode: (input, _options, ast) => {
			try {
				const nonce = Uint.from(input.nonce);
				const balance = Uint.from(input.balance);
				const codeHash = Bytes32.Bytes32(
					input.codeHash as string | Uint8Array | bigint | number,
				);
				const storageRoot = Bytes32.Bytes32(
					input.storageRoot as string | Uint8Array | bigint | number,
				);
				return ParseResult.succeed({
					nonce,
					balance,
					codeHash,
					storageRoot,
					__tag: "AccountState",
				} as AccountStateType);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, input, (e as Error).message),
				);
			}
		},
		encode: (state) =>
			ParseResult.succeed({
				nonce: state.nonce,
				balance: state.balance,
				codeHash: state.codeHash,
				storageRoot: state.storageRoot,
			}),
	}).annotations({ identifier: "AccountStateSchema" });

/**
 * The Keccak-256 hash of empty bytecode.
 * Used as the codeHash for externally owned accounts (EOAs).
 *
 * @description
 * This constant represents the hash of an empty byte sequence, which is the
 * codeHash value for all non-contract accounts. It equals:
 * keccak256('') = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
 *
 * @example
 * ```typescript
 * import { EMPTY_CODE_HASH, isContract } from 'voltaire-effect/primitives/AccountState'
 *
 * // Check if account is a contract
 * const isContractAccount = !equals(state.codeHash, EMPTY_CODE_HASH)
 * ```
 *
 * @since 0.0.1
 */
export const EMPTY_CODE_HASH = Bytes32.Bytes32(
	"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
);

/**
 * The root hash of an empty Merkle Patricia Trie.
 * Used as the storageRoot for accounts with no storage.
 *
 * @description
 * This constant represents the root of an empty trie, which is the storageRoot
 * value for accounts that have no storage slots set. It equals:
 * keccak256(RLP([])) = 0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
 *
 * @example
 * ```typescript
 * import { EMPTY_STORAGE_ROOT } from 'voltaire-effect/primitives/AccountState'
 *
 * // Check if account has storage
 * const hasStorage = !equals(state.storageRoot, EMPTY_STORAGE_ROOT)
 * ```
 *
 * @since 0.0.1
 */
export const EMPTY_STORAGE_ROOT = Bytes32.Bytes32(
	"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
);

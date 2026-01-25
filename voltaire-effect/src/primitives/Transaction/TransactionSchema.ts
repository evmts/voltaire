/**
 * @fileoverview Effect Schema definitions for Ethereum transactions.
 *
 * This module provides comprehensive Effect Schema definitions for all
 * Ethereum transaction types. Each schema validates the structure and
 * types of transaction fields, enabling type-safe parsing and serialization.
 *
 * @module TransactionSchema
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema, EIP1559Schema } from 'voltaire-effect/primitives/Transaction'
 *
 * // Validate any transaction type
 * const tx = S.decodeSync(Schema)(rawTransaction)
 *
 * // Validate specific transaction type
 * const eip1559Tx = S.decodeSync(EIP1559Schema)(rawEIP1559Tx)
 * ```
 *
 * @see {@link Schema} - Union schema for all transaction types
 * @see {@link LegacySchema} - Schema for Legacy transactions
 * @see {@link EIP1559Schema} - Schema for EIP-1559 transactions
 * @see {@link EIP2930Schema} - Schema for EIP-2930 transactions
 * @see {@link EIP4844Schema} - Schema for EIP-4844 blob transactions
 * @see {@link EIP7702Schema} - Schema for EIP-7702 set code transactions
 */

import { Address } from "@tevm/voltaire";
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import * as VoltaireTransaction from "@tevm/voltaire/Transaction";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type {
	Any,
	EIP1559,
	EIP2930,
	EIP4844,
	EIP7702,
	Legacy,
} from "./index.js";

const BigIntFromSelf = S.BigIntFromSelf;
const Uint8ArrayFromSelf = S.Uint8ArrayFromSelf;

/**
 * Internal schema for Address type validation.
 *
 * @description Validates that a value is a 20-byte Uint8Array representing
 * an Ethereum address.
 *
 * @internal
 * @since 0.0.1
 */
const AddressTypeSchema = S.declare<AddressType>(
	(u): u is AddressType => u instanceof Uint8Array && u.length === 20,
	{ identifier: "AddressType" },
);

/**
 * Internal schema for 32-byte hash validation.
 *
 * @description Validates that a value is a 32-byte Uint8Array representing
 * an Ethereum hash (used for storage keys, blob hashes, etc.).
 *
 * @internal
 * @since 0.0.1
 */
const HashTypeSchema = S.declare<HashType>(
	(u): u is HashType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "HashType" },
);

/**
 * Schema for transforming hex strings to AddressType.
 *
 * @internal
 * @since 0.0.1
 */
const AddressSchema: S.Schema<AddressType, string> = S.transformOrFail(
	S.String,
	AddressTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Address(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (a) => ParseResult.succeed(Address.toHex(a)),
	},
);

/**
 * Schema for nullable address fields (used for contract creation transactions).
 *
 * @internal
 * @since 0.0.1
 */
const NullableAddressSchema = S.NullOr(AddressSchema);

/**
 * Schema for EIP-2930 access list items (address + storage keys).
 *
 * @internal
 * @since 0.0.1
 */
const AccessListItemSchema = S.Struct({
	address: AddressSchema,
	storageKeys: S.Array(HashTypeSchema),
});

/**
 * Schema for EIP-2930 access lists.
 *
 * @internal
 * @since 0.0.1
 */
const AccessListSchema = S.Array(AccessListItemSchema);

/**
 * Schema for EIP-7702 authorization tuples.
 *
 * @internal
 * @since 0.0.1
 */
const AuthorizationSchema = S.Struct({
	chainId: BigIntFromSelf,
	address: AddressSchema,
	nonce: BigIntFromSelf,
	yParity: S.Number,
	r: Uint8ArrayFromSelf,
	s: Uint8ArrayFromSelf,
});

/**
 * Schema for EIP-7702 authorization lists.
 *
 * @internal
 * @since 0.0.1
 */
const AuthorizationListSchema = S.Array(AuthorizationSchema);

/**
 * Internal struct schema for Legacy transactions.
 * @internal
 */
const LegacySchemaInternal = S.Struct({
	type: S.Literal(VoltaireTransaction.Type.Legacy),
	nonce: BigIntFromSelf,
	gasPrice: BigIntFromSelf,
	gasLimit: BigIntFromSelf,
	to: NullableAddressSchema,
	value: BigIntFromSelf,
	data: Uint8ArrayFromSelf,
	v: BigIntFromSelf,
	r: Uint8ArrayFromSelf,
	s: Uint8ArrayFromSelf,
});

/**
 * Type guard schema for Legacy transactions.
 * @internal
 */
const LegacyTypeSchema = S.declare<Legacy>(
	(u): u is Legacy =>
		typeof u === "object" &&
		u !== null &&
		"type" in u &&
		(u as Legacy).type === VoltaireTransaction.Type.Legacy,
	{ identifier: "Legacy" },
);

/**
 * Effect Schema for Legacy (pre-EIP-2718) transactions.
 *
 * @description Validates Legacy transaction structure with gas price-based
 * fee model. Includes signature fields v, r, s where v encodes chain ID
 * for EIP-155 replay protection.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { LegacySchema } from 'voltaire-effect/primitives/Transaction'
 *
 * const tx = S.decodeSync(LegacySchema)({
 *   type: 0,
 *   nonce: 0n,
 *   gasPrice: 20000000000n,
 *   gasLimit: 21000n,
 *   to: '0x742d35Cc6634C0532925a3b844Bc9e7595f...',
 *   value: 1000000000000000000n,
 *   data: new Uint8Array(),
 *   v: 27n,
 *   r: new Uint8Array(32),
 *   s: new Uint8Array(32),
 * })
 * ```
 *
 * @see {@link Schema} - Union schema for all transaction types
 *
 * @since 0.0.1
 */
export const LegacySchema: S.Schema<
	Legacy,
	S.Schema.Encoded<typeof LegacySchemaInternal>
> = S.transform(LegacySchemaInternal, LegacyTypeSchema, {
	strict: true,
	decode: (d) => d as Legacy,
	encode: (e) => e,
});

/**
 * Internal struct schema for EIP-2930 transactions.
 * @internal
 */
const EIP2930SchemaInternal = S.Struct({
	type: S.Literal(VoltaireTransaction.Type.EIP2930),
	chainId: BigIntFromSelf,
	nonce: BigIntFromSelf,
	gasPrice: BigIntFromSelf,
	gasLimit: BigIntFromSelf,
	to: NullableAddressSchema,
	value: BigIntFromSelf,
	data: Uint8ArrayFromSelf,
	accessList: AccessListSchema,
	yParity: S.Number,
	r: Uint8ArrayFromSelf,
	s: Uint8ArrayFromSelf,
});

/**
 * Type guard schema for EIP-2930 transactions.
 * @internal
 */
const EIP2930TypeSchema = S.declare<EIP2930>(
	(u): u is EIP2930 =>
		typeof u === "object" &&
		u !== null &&
		"type" in u &&
		(u as EIP2930).type === VoltaireTransaction.Type.EIP2930,
	{ identifier: "EIP2930" },
);

/**
 * Effect Schema for EIP-2930 access list transactions.
 *
 * @description Validates EIP-2930 (type 1) transactions which introduce
 * access lists for gas optimization. Pre-declaring storage slots to be
 * accessed reduces cold storage access costs.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { EIP2930Schema } from 'voltaire-effect/primitives/Transaction'
 *
 * const tx = S.decodeSync(EIP2930Schema)({
 *   type: 1,
 *   chainId: 1n,
 *   accessList: [{ address: '0x...', storageKeys: [] }],
 *   // ... other fields
 * })
 * ```
 *
 * @see {@link Schema} - Union schema for all transaction types
 *
 * @since 0.0.1
 */
export const EIP2930Schema: S.Schema<
	EIP2930,
	S.Schema.Encoded<typeof EIP2930SchemaInternal>
> = S.transform(EIP2930SchemaInternal, EIP2930TypeSchema, {
	strict: true,
	decode: (d) => d as EIP2930,
	encode: (e) => e,
});

/**
 * Internal struct schema for EIP-1559 transactions.
 * @internal
 */
const EIP1559SchemaInternal = S.Struct({
	type: S.Literal(VoltaireTransaction.Type.EIP1559),
	chainId: BigIntFromSelf,
	nonce: BigIntFromSelf,
	maxPriorityFeePerGas: BigIntFromSelf,
	maxFeePerGas: BigIntFromSelf,
	gasLimit: BigIntFromSelf,
	to: NullableAddressSchema,
	value: BigIntFromSelf,
	data: Uint8ArrayFromSelf,
	accessList: AccessListSchema,
	yParity: S.Number,
	r: Uint8ArrayFromSelf,
	s: Uint8ArrayFromSelf,
});

/**
 * Type guard schema for EIP-1559 transactions.
 * @internal
 */
const EIP1559TypeSchema = S.declare<EIP1559>(
	(u): u is EIP1559 =>
		typeof u === "object" &&
		u !== null &&
		"type" in u &&
		(u as EIP1559).type === VoltaireTransaction.Type.EIP1559,
	{ identifier: "EIP1559" },
);

/**
 * Effect Schema for EIP-1559 fee market transactions.
 *
 * @description Validates EIP-1559 (type 2) transactions with dynamic fee
 * mechanism. Uses maxFeePerGas and maxPriorityFeePerGas instead of a single
 * gasPrice. This is the most common transaction type on modern Ethereum.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { EIP1559Schema } from 'voltaire-effect/primitives/Transaction'
 *
 * const tx = S.decodeSync(EIP1559Schema)({
 *   type: 2,
 *   chainId: 1n,
 *   maxFeePerGas: 30000000000n,
 *   maxPriorityFeePerGas: 1000000000n,
 *   // ... other fields
 * })
 * ```
 *
 * @see {@link Schema} - Union schema for all transaction types
 *
 * @since 0.0.1
 */
export const EIP1559Schema: S.Schema<
	EIP1559,
	S.Schema.Encoded<typeof EIP1559SchemaInternal>
> = S.transform(EIP1559SchemaInternal, EIP1559TypeSchema, {
	strict: true,
	decode: (d) => d as EIP1559,
	encode: (e) => e,
});

/**
 * Internal struct schema for EIP-4844 blob transactions.
 * @internal
 */
const EIP4844SchemaInternal = S.Struct({
	type: S.Literal(VoltaireTransaction.Type.EIP4844),
	chainId: BigIntFromSelf,
	nonce: BigIntFromSelf,
	maxPriorityFeePerGas: BigIntFromSelf,
	maxFeePerGas: BigIntFromSelf,
	gasLimit: BigIntFromSelf,
	to: AddressSchema,
	value: BigIntFromSelf,
	data: Uint8ArrayFromSelf,
	accessList: AccessListSchema,
	maxFeePerBlobGas: BigIntFromSelf,
	blobVersionedHashes: S.Array(HashTypeSchema),
	yParity: S.Number,
	r: Uint8ArrayFromSelf,
	s: Uint8ArrayFromSelf,
});

/**
 * Type guard schema for EIP-4844 blob transactions.
 * @internal
 */
const EIP4844TypeSchema = S.declare<EIP4844>(
	(u): u is EIP4844 =>
		typeof u === "object" &&
		u !== null &&
		"type" in u &&
		(u as EIP4844).type === VoltaireTransaction.Type.EIP4844,
	{ identifier: "EIP4844" },
);

/**
 * Effect Schema for EIP-4844 blob transactions.
 *
 * @description Validates EIP-4844 (type 3) transactions for proto-danksharding.
 * Used by Layer 2 rollups to post data availability blobs to Ethereum.
 * Includes maxFeePerBlobGas and blobVersionedHashes fields.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { EIP4844Schema } from 'voltaire-effect/primitives/Transaction'
 *
 * const tx = S.decodeSync(EIP4844Schema)({
 *   type: 3,
 *   chainId: 1n,
 *   maxFeePerBlobGas: 1000000000n,
 *   blobVersionedHashes: [new Uint8Array(32)],
 *   // ... other fields
 * })
 * ```
 *
 * @see {@link Schema} - Union schema for all transaction types
 *
 * @since 0.0.1
 */
export const EIP4844Schema: S.Schema<
	EIP4844,
	S.Schema.Encoded<typeof EIP4844SchemaInternal>
> = S.transform(EIP4844SchemaInternal, EIP4844TypeSchema, {
	strict: true,
	decode: (d) => d as EIP4844,
	encode: (e) => e,
});

/**
 * Internal struct schema for EIP-7702 set code transactions.
 * @internal
 */
const EIP7702SchemaInternal = S.Struct({
	type: S.Literal(VoltaireTransaction.Type.EIP7702),
	chainId: BigIntFromSelf,
	nonce: BigIntFromSelf,
	maxPriorityFeePerGas: BigIntFromSelf,
	maxFeePerGas: BigIntFromSelf,
	gasLimit: BigIntFromSelf,
	to: NullableAddressSchema,
	value: BigIntFromSelf,
	data: Uint8ArrayFromSelf,
	accessList: AccessListSchema,
	authorizationList: AuthorizationListSchema,
	yParity: S.Number,
	r: Uint8ArrayFromSelf,
	s: Uint8ArrayFromSelf,
});

/**
 * Type guard schema for EIP-7702 set code transactions.
 * @internal
 */
const EIP7702TypeSchema = S.declare<EIP7702>(
	(u): u is EIP7702 =>
		typeof u === "object" &&
		u !== null &&
		"type" in u &&
		(u as EIP7702).type === VoltaireTransaction.Type.EIP7702,
	{ identifier: "EIP7702" },
);

/**
 * Effect Schema for EIP-7702 set code transactions.
 *
 * @description Validates EIP-7702 (type 4) transactions for account abstraction.
 * Allows externally-owned accounts (EOAs) to temporarily delegate to smart
 * contract code via an authorization list.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { EIP7702Schema } from 'voltaire-effect/primitives/Transaction'
 *
 * const tx = S.decodeSync(EIP7702Schema)({
 *   type: 4,
 *   chainId: 1n,
 *   authorizationList: [{
 *     chainId: 1n,
 *     address: '0x...',
 *     nonce: 0n,
 *     yParity: 0,
 *     r: new Uint8Array(32),
 *     s: new Uint8Array(32),
 *   }],
 *   // ... other fields
 * })
 * ```
 *
 * @see {@link Schema} - Union schema for all transaction types
 *
 * @since 0.0.1
 */
export const EIP7702Schema: S.Schema<
	EIP7702,
	S.Schema.Encoded<typeof EIP7702SchemaInternal>
> = S.transform(EIP7702SchemaInternal, EIP7702TypeSchema, {
	strict: true,
	decode: (d) => d as EIP7702,
	encode: (e) => e,
});

/**
 * Type guard schema for any transaction type.
 * @internal
 */
const AnyTypeSchema = S.declare<Any>(
	(u): u is Any => typeof u === "object" && u !== null && "type" in u,
	{ identifier: "Transaction" },
);

/**
 * Effect Schema for any Ethereum transaction type.
 *
 * @description Union schema that automatically detects and validates any
 * supported Ethereum transaction type based on the `type` field. Supports
 * Legacy (0), EIP-2930 (1), EIP-1559 (2), EIP-4844 (3), and EIP-7702 (4).
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/Transaction'
 *
 * // Decode any transaction type
 * const tx = S.decodeSync(Schema)(rawTransaction)
 *
 * // Use in Effect pipelines
 * import * as Effect from 'effect/Effect'
 * const validated = yield* S.decode(Schema)(userInput)
 *
 * // Discriminate on type
 * switch (tx.type) {
 *   case 0: console.log('Legacy'); break
 *   case 2: console.log('EIP-1559'); break
 * }
 * ```
 *
 * @see {@link LegacySchema} - Schema for Legacy transactions only
 * @see {@link EIP1559Schema} - Schema for EIP-1559 transactions only
 * @see {@link EIP2930Schema} - Schema for EIP-2930 transactions only
 * @see {@link EIP4844Schema} - Schema for EIP-4844 transactions only
 * @see {@link EIP7702Schema} - Schema for EIP-7702 transactions only
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<
	Any,
	| S.Schema.Encoded<typeof LegacySchemaInternal>
	| S.Schema.Encoded<typeof EIP2930SchemaInternal>
	| S.Schema.Encoded<typeof EIP1559SchemaInternal>
	| S.Schema.Encoded<typeof EIP4844SchemaInternal>
	| S.Schema.Encoded<typeof EIP7702SchemaInternal>
> = S.transform(
	S.Union(
		LegacySchemaInternal,
		EIP2930SchemaInternal,
		EIP1559SchemaInternal,
		EIP4844SchemaInternal,
		EIP7702SchemaInternal,
	),
	AnyTypeSchema,
	{ strict: true, decode: (d) => d as Any, encode: (e) => e },
);

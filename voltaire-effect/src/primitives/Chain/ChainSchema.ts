/**
 * @fileoverview Effect Schema definitions for Ethereum chain configuration.
 * Provides type-safe schemas for parsing and validating chain definitions.
 * @module Chain/ChainSchema
 * @since 0.0.1
 */

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Ethereum hardfork identifiers.
 *
 * @description
 * Represents the various Ethereum protocol upgrades (hardforks) that have
 * occurred over time. Each hardfork introduces new features or changes
 * to the EVM and network behavior.
 *
 * @since 0.0.1
 */
export type Hardfork =
	| "chainstart"
	| "homestead"
	| "dao"
	| "tangerineWhistle"
	| "spuriousDragon"
	| "byzantium"
	| "constantinople"
	| "petersburg"
	| "istanbul"
	| "muirGlacier"
	| "berlin"
	| "london"
	| "arrowGlacier"
	| "grayGlacier"
	| "paris"
	| "shanghai"
	| "cancun"
	| "prague";

/**
 * Metadata about an Ethereum chain's configuration.
 *
 * @description
 * Contains technical details about a chain's behavior including block times,
 * gas limits, hardfork activation blocks, and layer information.
 *
 * @since 0.0.1
 */
export interface ChainMetadata {
	blockTime: number;
	gasLimit: number;
	isTestnet: boolean;
	isL2: boolean;
	l1ChainId?: number;
	latestHardfork: Hardfork;
	hardforks: Partial<Record<Hardfork, number>>;
	websocketUrls?: string[];
}

/**
 * Native currency configuration for a chain.
 *
 * @description
 * Defines the native currency used on a chain (e.g., ETH on Ethereum,
 * MATIC on Polygon). All EVM chains have 18 decimals by convention.
 *
 * @since 0.0.1
 */
export interface NativeCurrency {
	/** Display name (e.g., "Ether") */
	name: string;
	/** Symbol (e.g., "ETH") */
	symbol: string;
	/** Decimal places (typically 18) */
	decimals: number;
}

/**
 * Block explorer configuration.
 *
 * @description
 * Configuration for a chain's block explorer, used for generating
 * transaction and address URLs.
 *
 * @since 0.0.1
 */
export interface Explorer {
	/** Display name (e.g., "Etherscan") */
	name: string;
	/** Base URL (e.g., "https://etherscan.io") */
	url: string;
}

/**
 * Branded type representing an Ethereum chain configuration.
 *
 * @description
 * A complete chain configuration including chain ID, name, native currency,
 * RPC endpoints, and block explorers. Compatible with viem/wagmi chain format.
 *
 * @since 0.0.1
 */
export interface ChainType {
	readonly __tag: "Chain";
	id: number;
	name: string;
	nativeCurrency: NativeCurrency;
	rpcUrls?: { default: { http: readonly string[] } };
	blockExplorers?: { default: Explorer };
}

const ChainTypeSchema = S.declare<ChainType>(
	(u): u is ChainType => {
		if (typeof u !== "object" || u === null) return false;
		const chain = u as Record<string, unknown>;
		return (
			typeof chain.id === "number" &&
			typeof chain.name === "string" &&
			typeof chain.nativeCurrency === "object" &&
			chain.nativeCurrency !== null
		);
	},
	{ identifier: "Chain" },
);

/**
 * Input type for creating a Chain.
 *
 * @description
 * The minimal input required to create a ChainType. At minimum, a chain
 * needs an ID, name, and native currency. RPC URLs and block explorers
 * are optional.
 *
 * @since 0.0.1
 */
export interface ChainInput {
	id: number;
	name: string;
	nativeCurrency: NativeCurrency;
	rpcUrls?: { default: { http: readonly string[] } };
	blockExplorers?: { default: Explorer };
}

const ChainInputSchema = S.Struct({
	id: S.Number,
	name: S.String,
	nativeCurrency: S.Struct({
		name: S.String,
		symbol: S.String,
		decimals: S.Number,
	}),
	rpcUrls: S.optional(
		S.Struct({
			default: S.Struct({
				http: S.Array(S.String),
			}),
		}),
	),
	blockExplorers: S.optional(
		S.Struct({
			default: S.Struct({
				name: S.String,
				url: S.String,
			}),
		}),
	),
});

/**
 * Effect Schema for validating Ethereum chain configurations.
 *
 * @description
 * Transforms chain input data into branded ChainType values. Validates
 * that the chain ID is positive and all required fields are present.
 *
 * @example
 * ```typescript
 * import * as Chain from 'voltaire-effect/primitives/Chain'
 * import * as Schema from 'effect/Schema'
 *
 * // Create Ethereum mainnet config
 * const ethereum = Schema.decodeSync(Chain.ChainSchema)({
 *   id: 1,
 *   name: 'Ethereum',
 *   nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
 * })
 *
 * // With RPC URLs
 * const withRpc = Schema.decodeSync(Chain.ChainSchema)({
 *   id: 1,
 *   name: 'Ethereum',
 *   nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
 *   rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } }
 * })
 * ```
 *
 * @throws ParseResult.Type - When chain ID is invalid or required fields missing
 * @see {@link from} for Effect-wrapped chain creation
 * @since 0.0.1
 */
export const ChainSchema: S.Schema<ChainType, ChainInput> = S.transformOrFail(
	ChainInputSchema,
	ChainTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			if (typeof value.id !== "number" || value.id <= 0) {
				return ParseResult.fail(
					new ParseResult.Type(
						ast,
						value,
						"Chain ID must be a positive integer",
					),
				);
			}
			return ParseResult.succeed({
				__tag: "Chain" as const,
				...value,
			} as ChainType);
		},
		encode: (chain) =>
			ParseResult.succeed({
				id: chain.id,
				name: chain.name,
				nativeCurrency: chain.nativeCurrency,
				rpcUrls: chain.rpcUrls,
				blockExplorers: chain.blockExplorers,
			}),
	},
).annotations({ identifier: "ChainSchema" });

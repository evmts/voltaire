/**
 * @fileoverview ENS contract constants and ABIs.
 * @module Provider/ens/constants
 * @since 0.0.1
 */

/** ENS Universal Resolver address on Ethereum Mainnet */
export const ENS_UNIVERSAL_RESOLVER_ADDRESS =
	"0xce01f8eee7E479C928F8919abD53E553a36CeF67" as const;

/** ENS Registry address on Ethereum Mainnet */
export const ENS_REGISTRY_ADDRESS =
	"0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" as const;

/** Universal Resolver ABI for resolving ENS names */
export const universalResolverResolveAbi = [
	{
		name: "resolve",
		type: "function",
		stateMutability: "view",
		inputs: [
			{ name: "name", type: "bytes" },
			{ name: "data", type: "bytes" },
		],
		outputs: [
			{ name: "", type: "bytes" },
			{ name: "address", type: "address" },
		],
	},
] as const;

/** Universal Resolver ABI for reverse resolution */
export const universalResolverReverseAbi = [
	{
		name: "reverse",
		type: "function",
		stateMutability: "view",
		inputs: [{ type: "bytes", name: "reverseName" }],
		outputs: [
			{ type: "string", name: "resolvedName" },
			{ type: "address", name: "resolver" },
			{ type: "address", name: "reverseResolver" },
		],
	},
] as const;

/** ENS Registry ABI for resolver lookup */
export const ensRegistryAbi = [
	{
		name: "resolver",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "node", type: "bytes32" }],
		outputs: [{ name: "", type: "address" }],
	},
] as const;

/** Public Resolver ABI for address resolution */
export const addressResolverAbi = [
	{
		name: "addr",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "name", type: "bytes32" }],
		outputs: [{ name: "", type: "address" }],
	},
] as const;

/** Public Resolver ABI for text records */
export const textResolverAbi = [
	{
		name: "text",
		type: "function",
		stateMutability: "view",
		inputs: [
			{ name: "name", type: "bytes32" },
			{ name: "key", type: "string" },
		],
		outputs: [{ name: "", type: "string" }],
	},
] as const;

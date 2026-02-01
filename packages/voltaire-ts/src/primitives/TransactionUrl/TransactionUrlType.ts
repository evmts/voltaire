import type { brand } from "../../brand.js";
import type { AddressType } from "../Address/AddressType.js";
import type { BytesType } from "../Bytes/BytesType.js";

/**
 * ERC-681 compliant transaction URL
 * Format: ethereum:<address>[@<chainId>][/<function>][?<params>]
 *
 * @see https://eips.ethereum.org/EIPS/eip-681
 */
export type TransactionUrl = string & { readonly [brand]: "TransactionUrl" };

/**
 * Parsed ERC-681 transaction URL components
 */
export type ParsedTransactionUrl = {
	readonly target: AddressType;
	readonly chainId?: bigint;
	readonly value?: bigint;
	readonly gas?: bigint;
	readonly gasPrice?: bigint;
	readonly data?: BytesType;
	readonly functionName?: string;
	readonly functionParams?: Record<string, string>;
};

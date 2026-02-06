/**
 * @fileoverview Utility functions for Provider service.
 *
 * @module Provider/utils
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import type { AddressInput, AccessListInput, CallRequest, HashInput, BlockTag } from "./types.js";
import { ProviderResponseError } from "./types.js";

/**
 * Converts a Uint8Array to hex string.
 */
export const bytesToHex = (bytes: Uint8Array): `0x${string}` => {
	let hex = "0x";
	for (let i = 0; i < bytes.length; i++) {
		hex += bytes[i].toString(16).padStart(2, "0");
	}
	return hex as `0x${string}`;
};

/**
 * Converts AddressInput to hex string for RPC calls.
 */
export const toAddressHex = (input: AddressInput): `0x${string}` => {
	if (typeof input === "string") return input as `0x${string}`;
	return bytesToHex(input) as `0x${string}`;
};

/**
 * Converts HashInput to hex string for RPC calls.
 */
export const toHashHex = (input: HashInput): `0x${string}` => {
	if (typeof input === "string") return input as `0x${string}`;
	return bytesToHex(input) as `0x${string}`;
};

/**
 * Parses a hex quantity into bigint with consistent provider error handling.
 */
export const parseHexToBigInt = (input: {
	method: string;
	response: string;
	params?: unknown[];
}) =>
	Effect.try({
		try: () => BigInt(input.response),
		catch: (error) =>
			new ProviderResponseError(
				input,
				`Invalid hex response from RPC: ${input.response}`,
				{ cause: error instanceof Error ? error : undefined },
			),
	});

type RpcCallObject = {
	from?: `0x${string}`;
	to?: `0x${string}`;
	data?: `0x${string}`;
	value?: `0x${string}`;
	gas?: `0x${string}`;
	gasPrice?: `0x${string}`;
	maxFeePerGas?: `0x${string}`;
	maxPriorityFeePerGas?: `0x${string}`;
	nonce?: `0x${string}`;
};

type RpcAccessList = Array<{
	address: `0x${string}`;
	storageKeys: Array<`0x${string}`>;
}>;

type RpcLogFilterParams = {
	address?: `0x${string}` | `0x${string}`[];
	topics?: (string | string[] | null)[];
	fromBlock?: BlockTag;
	toBlock?: BlockTag;
	blockHash?: `0x${string}`;
};

type LogFilterParams = {
	address?: AddressInput | AddressInput[];
	topics?: (HashInput | HashInput[] | null)[];
	fromBlock?: BlockTag;
	toBlock?: BlockTag;
	blockHash?: HashInput;
};

/**
 * Formats a CallRequest for JSON-RPC submission.
 */
export const formatCallRequest = (tx: CallRequest): RpcCallObject => {
	const formatted: RpcCallObject = {};
	if (tx.from) formatted.from = toAddressHex(tx.from) as `0x${string}`;
	if (tx.to) formatted.to = toAddressHex(tx.to) as `0x${string}`;
	if (tx.data) formatted.data = tx.data as `0x${string}`;
	if (tx.value !== undefined) formatted.value = `0x${tx.value.toString(16)}`;
	if (tx.gas !== undefined) formatted.gas = `0x${tx.gas.toString(16)}`;
	return formatted;
};

/**
 * Formats log filter parameters for JSON-RPC submission.
 */
export const formatLogFilterParams = (filter: LogFilterParams): RpcLogFilterParams => {
	const params: RpcLogFilterParams = {};
	if (filter.address) {
		params.address = Array.isArray(filter.address)
			? filter.address.map(toAddressHex)
			: toAddressHex(filter.address);
	}
	if (filter.topics) {
		params.topics = filter.topics.map((topic) => {
			if (topic === null) return null;
			if (Array.isArray(topic)) return topic.map(toHashHex);
			return toHashHex(topic);
		});
	}
	if (filter.fromBlock !== undefined) params.fromBlock = filter.fromBlock;
	if (filter.toBlock !== undefined) params.toBlock = filter.toBlock;
	if (filter.blockHash !== undefined) {
		params.blockHash = toHashHex(filter.blockHash) as `0x${string}`;
	}
	return params;
};

/**
 * Formats access list for JSON-RPC submission.
 */
export const formatAccessList = (accessList: AccessListInput): RpcAccessList =>
	accessList.map((entry) => ({
		address: toAddressHex(entry.address),
		storageKeys: entry.storageKeys,
	}));

type RpcTransactionObject = RpcCallObject & {
	to?: `0x${string}` | null;
	accessList?: RpcAccessList;
	chainId?: `0x${string}`;
	type?: `0x${string}`;
	maxFeePerBlobGas?: `0x${string}`;
	blobVersionedHashes?: readonly `0x${string}`[];
};

export type RpcTransactionRequest = Omit<CallRequest, "from" | "to"> & {
	readonly from: AddressInput;
	readonly to?: AddressInput | null;
	readonly gasPrice?: bigint;
	readonly maxFeePerGas?: bigint;
	readonly maxPriorityFeePerGas?: bigint;
	readonly nonce?: bigint;
	readonly accessList?: AccessListInput;
	readonly chainId?: bigint;
	readonly type?: 0 | 1 | 2 | 3 | 4;
	readonly maxFeePerBlobGas?: bigint;
	readonly blobVersionedHashes?: readonly `0x${string}`[];
};

/**
 * Formats a transaction request for JSON-RPC submission.
 */
export const formatTransactionRequest = (
	tx: RpcTransactionRequest,
): RpcTransactionObject => {
	const formatted: RpcTransactionObject = {};
	formatted.from = toAddressHex(tx.from);
	if (tx.to !== undefined) {
		if (tx.to !== null) {
			formatted.to = toAddressHex(tx.to);
		}
	}
	if (tx.data) formatted.data = tx.data as `0x${string}`;
	if (tx.value !== undefined) formatted.value = `0x${tx.value.toString(16)}`;
	if (tx.gas !== undefined) formatted.gas = `0x${tx.gas.toString(16)}`;
	if (tx.gasPrice !== undefined) {
		formatted.gasPrice = `0x${tx.gasPrice.toString(16)}`;
	}
	if (tx.maxFeePerGas !== undefined) {
		formatted.maxFeePerGas = `0x${tx.maxFeePerGas.toString(16)}`;
	}
	if (tx.maxPriorityFeePerGas !== undefined) {
		formatted.maxPriorityFeePerGas = `0x${tx.maxPriorityFeePerGas.toString(16)}`;
	}
	if (tx.nonce !== undefined) {
		formatted.nonce = `0x${tx.nonce.toString(16)}`;
	}
	if (tx.accessList) {
		formatted.accessList = formatAccessList(tx.accessList);
	}
	if (tx.chainId !== undefined) {
		formatted.chainId = `0x${tx.chainId.toString(16)}`;
	}
	if (tx.type !== undefined) {
		formatted.type = `0x${tx.type.toString(16)}`;
	}
	if (tx.maxFeePerBlobGas !== undefined) {
		formatted.maxFeePerBlobGas = `0x${tx.maxFeePerBlobGas.toString(16)}`;
	}
	if (tx.blobVersionedHashes) {
		formatted.blobVersionedHashes = tx.blobVersionedHashes;
	}
	return formatted;
};

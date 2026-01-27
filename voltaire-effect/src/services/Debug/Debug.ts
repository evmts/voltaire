/**
 * @fileoverview Live implementation of DebugService using TransportService.
 *
 * @module Debug
 * @since 0.3.0
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportService } from "../Transport/TransportService.js";
import type {
	AddressInput,
	BlockTag,
	CallRequest,
	HashInput,
	TransactionIndexInput,
} from "../Provider/ProviderService.js";
import { DebugService } from "./DebugService.js";

const bytesToHex = (bytes: Uint8Array): `0x${string}` => {
	let hex = "0x";
	for (let i = 0; i < bytes.length; i++) {
		hex += bytes[i].toString(16).padStart(2, "0");
	}
	return hex as `0x${string}`;
};

const toAddressHex = (input: AddressInput): `0x${string}` => {
	if (typeof input === "string") return input as `0x${string}`;
	return bytesToHex(input);
};

const toHashHex = (input: HashInput): `0x${string}` => {
	if (typeof input === "string") return input as `0x${string}`;
	return bytesToHex(input);
};

const toIndexHex = (index: TransactionIndexInput): `0x${string}` => {
	if (typeof index === "string") return index as `0x${string}`;
	const value = typeof index === "number" ? BigInt(index) : index;
	return `0x${value.toString(16)}` as `0x${string}`;
};

const toBlockId = (blockId: BlockTag | HashInput | bigint): string => {
	if (typeof blockId === "bigint") {
		return `0x${blockId.toString(16)}`;
	}
	if (typeof blockId === "string") return blockId;
	return bytesToHex(blockId);
};

const formatCallRequest = (tx: CallRequest) => {
	const formatted: Record<string, unknown> = {};
	if (tx.from) formatted.from = toAddressHex(tx.from);
	if (tx.to) formatted.to = toAddressHex(tx.to);
	if (tx.data) formatted.data = tx.data;
	if (tx.value !== undefined) formatted.value = `0x${tx.value.toString(16)}`;
	if (tx.gas !== undefined) formatted.gas = `0x${tx.gas.toString(16)}`;
	return formatted;
};

/**
 * Live implementation of the Debug layer.
 *
 * @since 0.3.0
 */
export const Debug: Layer.Layer<DebugService, never, TransportService> =
	Layer.effect(
		DebugService,
		Effect.gen(function* () {
			const transport = yield* TransportService;
			const request = <T>(method: string, params?: unknown[]) =>
				transport.request<T>(method, params);

			return {
				traceTransaction: (hash, config) =>
					request<unknown>("debug_traceTransaction", [
						toHashHex(hash),
						...(config ? [config] : []),
					]),
				traceCall: (tx, blockTag = "latest", config) => {
					const params: unknown[] = [formatCallRequest(tx), blockTag];
					if (config !== undefined) params.push(config);
					return request<unknown>("debug_traceCall", params);
				},
				traceBlockByNumber: (blockTag, config) => {
					const blockRef =
						typeof blockTag === "bigint"
							? (`0x${blockTag.toString(16)}` as const)
							: blockTag;
					const params: unknown[] = [blockRef];
					if (config !== undefined) params.push(config);
					return request<unknown>("debug_traceBlockByNumber", params);
				},
				traceBlockByHash: (blockHash, config) => {
					const params: unknown[] = [toHashHex(blockHash)];
					if (config !== undefined) params.push(config);
					return request<unknown>("debug_traceBlockByHash", params);
				},
				getBadBlocks: () => request<unknown>("debug_getBadBlocks"),
				getRawBlock: (blockId) =>
					request<`0x${string}`>("debug_getRawBlock", [toBlockId(blockId)]),
				getRawHeader: (blockId) =>
					request<`0x${string}`>("debug_getRawHeader", [toBlockId(blockId)]),
				getRawReceipts: (blockId) =>
					request<`0x${string}`[]>("debug_getRawReceipts", [
						toBlockId(blockId),
					]),
				getRawTransaction: (hash) =>
					request<`0x${string}`>("debug_getRawTransaction", [
						toHashHex(hash),
					]),
				storageRangeAt: (
					blockHash,
					txIndex,
					address,
					startKey,
					maxResults,
				) =>
					request<unknown>("debug_storageRangeAt", [
						toHashHex(blockHash),
						toIndexHex(txIndex),
						toAddressHex(address),
						typeof startKey === "string" ? startKey : toHashHex(startKey),
						maxResults,
					]),
			};
		}),
	);

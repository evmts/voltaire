/**
 * @fileoverview Simulate multiple calls and derive asset changes.
 *
 * @module Provider/simulateCalls
 * @since 0.0.1
 */

import { Address } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { TransportService } from "../Transport/TransportService.js";
import {
	type AddressInput,
	type BlockTag,
	type CallRequest,
	type LogType,
	ProviderError,
} from "./ProviderService.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const NATIVE_ASSET = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" as const;
const ERC20_TRANSFER_TOPIC =
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as const;

type HexString = `0x${string}`;

type SimulateV1CallResult = {
	status: string;
	returnData: HexString;
	gasUsed: HexString;
	logs?: LogType[];
	error?: { code?: number; message?: string };
};

type SimulateV1BlockResult = {
	calls: SimulateV1CallResult[];
};

type SimulateV1Result = SimulateV1BlockResult[];

export type AssetChange = {
	asset: HexString;
	from: HexString;
	to: HexString;
	amount: bigint;
	type: "transfer" | "mint" | "burn";
};

export type SimulationResult = {
	success: boolean;
	returnData: HexString;
	gasUsed: bigint;
	logs: LogType[];
	assetChanges: AssetChange[];
};

export interface SimulateCallsParams {
	readonly calls: readonly CallRequest[];
	readonly account?: AddressInput;
	readonly blockTag?: BlockTag;
}

type RawCallTrace = {
	from?: string;
	to?: string;
	value?: string | bigint | number;
	calls?: readonly RawCallTrace[];
};

const normalizeAddress = (
	input?: AddressInput | string | null,
): HexString | undefined => {
	if (!input) return undefined;
	const hex = typeof input === "string" ? input : Address.toHex(input);
	return hex.toLowerCase() as HexString;
};

const toHexQuantity = (value: bigint): HexString =>
	`0x${value.toString(16)}` as HexString;

const parseHexToBigInt = (value?: string | bigint | number | null): bigint => {
	if (typeof value === "bigint") return value;
	if (typeof value === "number") return BigInt(value);
	if (typeof value !== "string") return 0n;
	if (value === "0x" || value === "") return 0n;
	try {
		return BigInt(value);
	} catch {
		return 0n;
	}
};

const topicToAddress = (topic: string): HexString | undefined => {
	if (!topic.startsWith("0x")) return undefined;
	const hex = topic.slice(2).toLowerCase();
	if (hex.length < 40) return undefined;
	const padded = hex.padStart(64, "0");
	return `0x${padded.slice(24)}` as HexString;
};

const classifyTransfer = (from: HexString, to: HexString) => {
	if (from === ZERO_ADDRESS) return "mint" as const;
	if (to === ZERO_ADDRESS) return "burn" as const;
	return "transfer" as const;
};

const formatCall = (call: CallRequest, account?: AddressInput) => {
	const formatted: Record<string, unknown> = {};
	const from = normalizeAddress(call.from ?? account);
	const to = normalizeAddress(call.to ?? undefined);
	if (from) formatted.from = from;
	if (to) formatted.to = to;
	if (call.data) formatted.data = call.data as HexString;
	if (call.value !== undefined) formatted.value = toHexQuantity(call.value);
	if (call.gas !== undefined) formatted.gas = toHexQuantity(call.gas);
	return formatted;
};

const extractCallTrace = (trace: unknown): RawCallTrace | null => {
	if (!trace || typeof trace !== "object") return null;
	const maybe = trace as { callTrace?: unknown; result?: unknown };
	if (maybe.callTrace && typeof maybe.callTrace === "object") {
		return maybe.callTrace as RawCallTrace;
	}
	if (maybe.result && typeof maybe.result === "object") {
		return maybe.result as RawCallTrace;
	}
	return trace as RawCallTrace;
};

const collectTraceTransfers = (calls?: readonly RawCallTrace[]) => {
	if (!calls || calls.length === 0) return [] as AssetChange[];
	const changes: AssetChange[] = [];
	for (const call of calls) {
		const from = normalizeAddress(call.from ?? undefined);
		const to = normalizeAddress(call.to ?? undefined);
		const amount = parseHexToBigInt(call.value ?? undefined);
		if (amount > 0n && from && to) {
			changes.push({
				asset: NATIVE_ASSET,
				from,
				to,
				amount,
				type: classifyTransfer(from, to),
			});
		}
		if (call.calls && call.calls.length > 0) {
			changes.push(...collectTraceTransfers(call.calls));
		}
	}
	return changes;
};

const extractErc20Transfers = (logs: LogType[]): AssetChange[] => {
	const changes: AssetChange[] = [];
	for (const log of logs) {
		const topic = log.topics?.[0]?.toLowerCase();
		if (topic !== ERC20_TRANSFER_TOPIC) continue;
		const from = topicToAddress(log.topics[1] ?? "");
		const to = topicToAddress(log.topics[2] ?? "");
		if (!from || !to) continue;
		const amount = parseHexToBigInt(log.data);
		changes.push({
			asset: normalizeAddress(log.address) ?? (log.address as HexString),
			from,
			to,
			amount,
			type: classifyTransfer(from, to),
		});
	}
	return changes;
};

const extractCallValueTransfer = (
	call: CallRequest,
	account?: AddressInput,
): AssetChange | null => {
	const amount = call.value ?? 0n;
	if (amount <= 0n) return null;
	const from = normalizeAddress(call.from ?? account);
	const to = normalizeAddress(call.to ?? undefined);
	if (!from || !to) return null;
	return {
		asset: NATIVE_ASSET,
		from,
		to,
		amount,
		type: classifyTransfer(from, to),
	};
};

export const simulateCalls = (
	params: SimulateCallsParams,
): Effect.Effect<SimulationResult[], ProviderError, TransportService> =>
	Effect.gen(function* () {
		const transport = yield* TransportService;
		const blockTag = params.blockTag ?? "latest";

		const request = <T>(method: string, rpcParams?: unknown[]) =>
			transport.request<T>(method, rpcParams).pipe(
				Effect.mapError(
					(error) =>
						new ProviderError({ method, params: rpcParams }, error.message, {
							cause: error,
							code: error.code,
							context: { method, params: rpcParams },
						}),
				),
			);

		const formattedCalls = params.calls.map((call) =>
			formatCall(call, params.account),
		);
		const payload = { blockStateCalls: [{ calls: formattedCalls }] };
		const simulateParams = [payload, blockTag];
		const response = yield* request<SimulateV1Result>(
			"eth_simulateV1",
			simulateParams,
		);

		if (!Array.isArray(response) || response.length === 0) {
			return yield* Effect.fail(
				new ProviderError(
					{ method: "eth_simulateV1", response },
					"Invalid response from eth_simulateV1",
				),
			);
		}

		const blockResult = response[0];
		if (!blockResult || !Array.isArray(blockResult.calls)) {
			return yield* Effect.fail(
				new ProviderError(
					{ method: "eth_simulateV1", response },
					"Missing call results in eth_simulateV1 response",
				),
			);
		}

		const traceResults = yield* Effect.forEach(
			params.calls,
			(call) =>
				request<unknown>("debug_traceCall", [
					formatCall(call, params.account),
					blockTag,
					{ tracer: "callTracer" },
				]).pipe(Effect.catchAll(() => Effect.succeed(null))),
			{ concurrency: "unbounded" },
		);

		return params.calls.map((call, index) => {
			const result = blockResult.calls[index];
			const success = result?.status?.toLowerCase() === "0x1";
			const returnData = result?.returnData ?? "0x";
			const gasUsed = parseHexToBigInt(result?.gasUsed ?? "0x0");
			const logs = success && Array.isArray(result?.logs) ? result.logs : [];

			const assetChanges: AssetChange[] = [];
			assetChanges.push(...extractErc20Transfers(logs));

			const valueTransfer = extractCallValueTransfer(call, params.account);
			if (valueTransfer) assetChanges.push(valueTransfer);

			const trace = extractCallTrace(traceResults[index]);
			if (trace?.calls?.length) {
				assetChanges.push(...collectTraceTransfers(trace.calls));
			}

			return {
				success,
				returnData,
				gasUsed,
				logs,
				assetChanges,
			};
		});
	});

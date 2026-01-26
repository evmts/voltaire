/**
 * @fileoverview Contract factory for type-safe smart contract interactions.
 *
 * @module Contract
 * @since 0.0.1
 *
 * @description
 * Provides a factory function to create type-safe contract instances from
 * an ABI and address. The resulting instance provides:
 *
 * - `.read` - Read-only methods (view/pure functions)
 * - `.write` - State-changing methods (returns tx hash)
 * - `.simulate` - Simulate write methods without sending
 * - `.getEvents` - Query historical events
 *
 * All methods are type-safe based on the ABI definition.
 *
 * Requires ProviderService for read operations.
 * Write operations additionally require SignerService.
 *
 * @see {@link ContractInstance} - The returned contract interface
 * @see {@link ProviderService} - Required for all operations
 * @see {@link SignerService} - Required for write operations
 */

import {
	Address,
	BrandedAbi,
	type BrandedAddress,
	type BrandedHash,
	type BrandedHex,
	Hash,
	Hex,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import {
	type LogType,
	ProviderService,
	type LogFilter as ProviderLogFilter,
} from "../Provider/index.js";
import { SignerService } from "../Signer/index.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type HashType = BrandedHash.HashType;

import {
	type Abi,
	type AbiItem,
	ContractCallError,
	ContractEventError,
	type ContractInstance,
	ContractWriteError,
	type DecodedEvent,
	type EventFilter,
	type WriteOptions,
} from "./ContractTypes.js";
import { estimateGas } from "./estimateGas.js";

/**
 * Encodes function arguments for a contract call.
 *
 * @param abi - The contract ABI
 * @param functionName - The function to encode
 * @param args - The arguments to encode
 * @returns Encoded calldata as hex
 *
 * @internal
 */
function encodeArgs(
	abi: readonly AbiItem[],
	functionName: string,
	args: readonly unknown[],
): HexType {
	return BrandedAbi.encodeFunction(
		abi as unknown as BrandedAbi.Abi,
		functionName,
		args,
	);
}

/**
 * Decodes the result of a contract call.
 * @param abi - The contract ABI
 * @param functionName - The function that was called
 * @param data - The raw return data
 * @param context - Context for error reporting
 * @returns Effect that resolves to decoded result (single value or tuple)
 */
const decodeResultE = (
	abi: readonly AbiItem[],
	functionName: string,
	data: HexType,
	context: { address: string; args?: unknown[] },
): Effect.Effect<unknown, ContractCallError> =>
	Effect.try({
		try: () => {
			const fn = abi.find(
				(item): item is BrandedAbi.Function.FunctionType =>
					item.type === "function" && (item as any).name === functionName,
			) as BrandedAbi.Function.FunctionType | undefined;
			if (!fn) throw new Error(`Function ${functionName} not found in ABI`);

			const bytes = Hex.toBytes(data);
			const decoded = BrandedAbi.Function.decodeResult(fn, bytes);
			if (fn.outputs.length === 1) {
				return decoded[0];
			}
			return decoded;
		},
		catch: (e) =>
			new ContractCallError(
				{ address: context.address, method: functionName, args: context.args },
				e instanceof Error ? e.message : "Decode error",
				{ cause: e instanceof Error ? e : undefined },
			),
	});

/**
 * Gets the event topic (selector) for an event.
 * @param abi - The contract ABI
 * @param eventName - The event name
 * @param address - Contract address for error context
 * @returns Effect that resolves to hex-encoded topic (keccak256 of event signature)
 */
const getEventTopicE = (
	abi: readonly AbiItem[],
	eventName: string,
	address: string,
): Effect.Effect<string, ContractEventError> =>
	Effect.try({
		try: () => {
			const event = abi.find(
				(item) => item.type === "event" && item.name === eventName,
			) as BrandedAbi.Event.EventType | undefined;
			if (!event) throw new Error(`Event ${eventName} not found in ABI`);
			const selector = BrandedAbi.Event.getSelector(event);
			return Hash.toHex(selector) as string;
		},
		catch: (e) =>
			new ContractEventError(
				{ address, event: eventName },
				e instanceof Error ? e.message : "Event lookup error",
				{ cause: e instanceof Error ? e : undefined },
			),
	});

/**
 * Decodes a raw event log into a structured event.
 * @param abi - The contract ABI
 * @param eventName - The expected event name
 * @param log - The raw log data
 * @param address - Contract address for error context
 * @returns Effect that resolves to decoded event with name, args, and metadata
 */
const decodeEventLogE = (
	abi: readonly AbiItem[],
	eventName: string,
	log: LogType,
	address: string,
): Effect.Effect<DecodedEvent, ContractEventError> =>
	Effect.try({
		try: () => {
			const event = abi.find(
				(item) => item.type === "event" && item.name === eventName,
			) as BrandedAbi.Event.EventType | undefined;
			if (!event) throw new Error(`Event ${eventName} not found in ABI`);

			const dataBytes = Hex.toBytes(log.data as `0x${string}`);
			const topicBytes = log.topics.map((t) =>
				Hex.toBytes(t as `0x${string}`),
			) as unknown as readonly HashType[];
			const decoded = BrandedAbi.Event.decodeLog(event, dataBytes, topicBytes);

			return {
				eventName,
				args: decoded as Record<string, unknown>,
				blockNumber: BigInt(log.blockNumber),
				transactionHash: log.transactionHash as HexType,
				logIndex: Number.parseInt(log.logIndex, 16),
			};
		},
		catch: (e) =>
			new ContractEventError(
				{ address, event: eventName },
				e instanceof Error ? e.message : "Event decode error",
				{ cause: e instanceof Error ? e : undefined },
			),
	});

type ContractFactory = <TAbi extends Abi>(
	address: AddressType | `0x${string}`,
	abi: TAbi,
) => Effect.Effect<ContractInstance<TAbi>, never, ProviderService>;

type ContractService = ContractFactory & { estimateGas: typeof estimateGas };

/**
 * Creates a type-safe contract instance for interacting with a deployed contract.
 * Provides read, write, simulate, and event methods based on the ABI.
 *
 * @param address - The contract address
 * @param abi - The contract ABI
 * @returns Effect that resolves to a ContractInstance
 *
 * @example
 * ```typescript
 * const erc20Abi = [
 *   { type: 'function', name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
 *   { type: 'function', name: 'transfer', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
 *   { type: 'event', name: 'Transfer', inputs: [{ type: 'address', indexed: true }, { type: 'address', indexed: true }, { type: 'uint256' }] }
 * ] as const
 *
 * const program = Effect.gen(function* () {
 *   const token = yield* Contract(tokenAddress, erc20Abi)
 *   const balance = yield* token.read.balanceOf(userAddress)
 *   const txHash = yield* token.write.transfer(recipient, amount)
 *   const events = yield* token.getEvents('Transfer', { fromBlock: 'latest' })
 *   return { balance, txHash, events }
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(Signer.Live),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 * @since 0.0.1
 */
const ContractFactory: ContractFactory = <TAbi extends Abi>(
	address: AddressType | `0x${string}`,
	abi: TAbi,
): Effect.Effect<ContractInstance<TAbi>, never, ProviderService> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		const abiItems = abi as readonly AbiItem[];
		const addressHex =
			typeof address === "string"
				? address
				: Address.toHex(address as AddressType);
		const brandedAddress =
			typeof address === "string"
				? Address.fromHex(address)
				: (address as AddressType);

		const viewFunctions = abiItems.filter(
			(
				item,
			): item is AbiItem & { name: string; stateMutability: "view" | "pure" } =>
				item.type === "function" &&
				(item.stateMutability === "view" || item.stateMutability === "pure") &&
				item.name !== undefined,
		);

		const writeFunctions = abiItems.filter(
			(item): item is AbiItem & { name: string } =>
				item.type === "function" &&
				item.stateMutability !== "view" &&
				item.stateMutability !== "pure" &&
				item.name !== undefined,
		);

		const read = {} as ContractInstance<TAbi>["read"];
		for (const fn of viewFunctions) {
			(
				read as unknown as Record<
					string,
					(...args: unknown[]) => Effect.Effect<unknown, ContractCallError>
				>
			)[fn.name] = (...args: unknown[]) =>
				Effect.gen(function* () {
					const data = encodeArgs(abiItems, fn.name, args);
					const result = yield* provider
						.call({ to: addressHex, data })
						.pipe(
							Effect.mapError(
								(e) =>
									new ContractCallError(
										{ address: addressHex, method: fn.name, args },
										e.message,
										{ cause: e },
									),
							),
						);
					return yield* decodeResultE(abiItems, fn.name, result as HexType, {
						address: addressHex,
						args,
					});
				});
		}

		const write = {} as ContractInstance<TAbi>["write"];
		for (const fn of writeFunctions) {
			const inputCount = fn.inputs?.length ?? 0;
			(
				write as unknown as Record<
					string,
					(
						...args: unknown[]
					) => Effect.Effect<HashType, ContractWriteError, SignerService>
				>
			)[fn.name] = (...argsAndOptions: unknown[]) =>
				Effect.gen(function* () {
					const signer = yield* SignerService;

					const lastArg = argsAndOptions[argsAndOptions.length - 1];
					const isOptions =
						lastArg !== null &&
						typeof lastArg === "object" &&
						!Array.isArray(lastArg) &&
						("value" in lastArg ||
							"gas" in lastArg ||
							"gasPrice" in lastArg ||
							"maxFeePerGas" in lastArg ||
							"maxPriorityFeePerGas" in lastArg ||
							"nonce" in lastArg);

					const hasOptions = isOptions && argsAndOptions.length > inputCount;
					const args = hasOptions
						? argsAndOptions.slice(0, -1)
						: argsAndOptions;
					const options = hasOptions ? (lastArg as WriteOptions) : {};

					const data = encodeArgs(abiItems, fn.name, args);
					const txHash = yield* signer
						.sendTransaction({
							to: brandedAddress as unknown as undefined,
							data: data as unknown as undefined,
							value: options.value,
							gasLimit: options.gas,
							gasPrice: options.gasPrice,
							maxFeePerGas: options.maxFeePerGas,
							maxPriorityFeePerGas: options.maxPriorityFeePerGas,
							nonce: options.nonce,
						})
						.pipe(
							Effect.mapError(
								(e) =>
									new ContractWriteError(
										{ address: addressHex, method: fn.name, args },
										e.message,
										{ cause: e instanceof Error ? e : undefined },
									),
							),
						);
					return txHash;
				});
		}

		const simulate = {} as ContractInstance<TAbi>["simulate"];
		for (const fn of writeFunctions) {
			(
				simulate as unknown as Record<
					string,
					(...args: unknown[]) => Effect.Effect<unknown, ContractCallError>
				>
			)[fn.name] = (...args: unknown[]) =>
				Effect.gen(function* () {
					const data = encodeArgs(abiItems, fn.name, args);
					const result = yield* provider.call({ to: addressHex, data }).pipe(
						Effect.mapError(
							(e) =>
								new ContractCallError(
									{
										address: addressHex,
										method: fn.name,
										args,
										simulate: true,
									},
									e.message,
									{ cause: e },
								),
						),
					);
					return yield* decodeResultE(abiItems, fn.name, result as HexType, {
						address: addressHex,
						args,
					});
				});
		}

		const getEvents = <E extends string>(
			eventName: E,
			filter?: EventFilter,
		): Effect.Effect<DecodedEvent[], ContractEventError> =>
			Effect.gen(function* () {
				const topic = yield* getEventTopicE(abiItems, eventName, addressHex);

				const toProviderBlockTag = (
					tag: import("./ContractTypes.js").BlockTag | undefined,
				) => {
					if (tag === undefined) return undefined;
					if (typeof tag === "bigint") return `0x${tag.toString(16)}` as const;
					return tag;
				};

				const logFilter: ProviderLogFilter = {
					address: addressHex,
					topics: [topic as `0x${string}`],
					fromBlock: toProviderBlockTag(filter?.fromBlock),
					toBlock: toProviderBlockTag(filter?.toBlock),
				};

				const logs = yield* provider
					.getLogs(logFilter)
					.pipe(
						Effect.mapError(
							(e) =>
								new ContractEventError(
									{ address: addressHex, event: eventName, filter },
									e.message,
									{ cause: e },
								),
						),
					);

				return yield* Effect.forEach(logs, (log) =>
					decodeEventLogE(abiItems, eventName, log, addressHex),
				);
			});

		return {
			address: brandedAddress,
			abi,
			read,
			write,
			simulate,
			getEvents,
		} as ContractInstance<TAbi>;
	});

export const Contract: ContractService = Object.assign(ContractFactory, {
	estimateGas,
});

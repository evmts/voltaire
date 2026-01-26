/**
 * @fileoverview EIP-4844 blob base fee helpers.
 *
 * @module Provider/getBlobBaseFee
 * @since 0.0.1
 */

import {
	GAS_PER_BLOB,
	InvalidBlobCountError,
	MAX_PER_TRANSACTION,
} from "@tevm/voltaire/Blob";
import { BlobBaseFee } from "@tevm/voltaire/FeeMarket";
import * as Effect from "effect/Effect";
import { TransportService } from "../Transport/TransportService.js";
import { ProviderError, type BlockType } from "./ProviderService.js";

const METHOD_NOT_FOUND = -32601;

const parseHexToBigInt = (method: string, hex: string) =>
	Effect.try({
		try: () => BigInt(hex),
		catch: (error) =>
			new ProviderError(
				{ method, response: hex },
				`Invalid hex response from RPC: ${hex}`,
				{ cause: error instanceof Error ? error : undefined },
			),
	});

const blobBaseFeeFromBlock = (block: BlockType) => {
	if (block.excessBlobGas === undefined || block.excessBlobGas === null) {
		return Effect.fail(
			new ProviderError(
				{ method: "eth_getBlockByNumber", blockNumber: block.number },
				"Blob base fee not available for pre-Dencun blocks",
			),
		);
	}

	return parseHexToBigInt("eth_getBlockByNumber", block.excessBlobGas).pipe(
		Effect.map((excessBlobGas) => BlobBaseFee(excessBlobGas)),
	);
};

/**
 * Estimates blob gas usage for a given blob count.
 *
 * @param blobCount - Number of blobs
 * @returns Blob gas used (bigint)
 * @throws {InvalidBlobCountError} When blob count is negative or exceeds maximum
 *
 * @example
 * ```typescript
 * const blobGas = estimateBlobGas(3) // 393216n
 * ```
 */
export const estimateBlobGas = (blobCount: number | bigint): bigint => {
	const count = typeof blobCount === "bigint" ? blobCount : BigInt(blobCount);
	const maxBlobs = BigInt(MAX_PER_TRANSACTION);

	if (count < 0n || count > maxBlobs) {
		throw new InvalidBlobCountError(
			`Invalid blob count: ${blobCount} (max ${MAX_PER_TRANSACTION})`,
			{
				value: blobCount,
				expected: `0-${MAX_PER_TRANSACTION} blobs`,
			},
		);
	}

	return count * BigInt(GAS_PER_BLOB);
};

/**
 * Calculates total blob fee from base fee and blob gas used.
 *
 * @param baseFee - Blob base fee (wei per blob gas)
 * @param blobGasUsed - Total blob gas used
 * @returns Total blob gas fee (wei)
 */
export const calculateBlobGasPrice = (
	baseFee: bigint,
	blobGasUsed: bigint,
): bigint => baseFee * blobGasUsed;

/**
 * Gets the current blob base fee (EIP-4844).
 *
 * @description
 * Attempts to call `eth_blobBaseFee` and falls back to calculating the base
 * fee from the latest block's `excessBlobGas` if the RPC method is unavailable.
 *
 * @returns Effect yielding the blob base fee as bigint
 *
 * @example
 * ```typescript
 * const fee = yield* getBlobBaseFee()
 * ```
 */
export const getBlobBaseFee = (): Effect.Effect<
	bigint,
	ProviderError,
	TransportService
> =>
	Effect.gen(function* () {
		const transport = yield* TransportService;

		const request = <T>(method: string, params?: unknown[]) =>
			transport.request<T>(method, params).pipe(
				Effect.mapError(
					(error) =>
						new ProviderError({ method, params }, error.message, {
							cause: error,
							code: error.code,
							context: { method, params },
						}),
				),
			);

		const fromRpc = request<string>("eth_blobBaseFee").pipe(
			Effect.flatMap((hex) => parseHexToBigInt("eth_blobBaseFee", hex)),
		);

		const fromBlock = request<BlockType | null>("eth_getBlockByNumber", [
			"latest",
			false,
		]).pipe(
			Effect.flatMap((block) =>
				block
					? blobBaseFeeFromBlock(block)
					: Effect.fail(
							new ProviderError(
								{ method: "eth_getBlockByNumber", params: ["latest", false] },
								"Block not found",
							),
						),
			),
		);

		return yield* fromRpc.pipe(
			Effect.catchTag("ProviderError", (error) =>
				error.code === METHOD_NOT_FOUND ? fromBlock : Effect.fail(error),
			),
		);
	});

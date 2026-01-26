import { describe, expect, it, vi } from "@effect/vitest";
import * as Effect from "effect/Effect";
import { TransportError } from "../Transport/TransportError.js";
import {
	EthBlockNumber,
	EthCall,
	EthGetBalance,
	EthGetLogs,
	GenericRpcRequest,
} from "./RpcRequest.js";
import { makeRpcResolver } from "./RpcResolver.js";

const createMockTransport = () => ({
	request: vi.fn(),
});

describe("RpcResolver", () => {
	describe("makeRpcResolver", () => {
		describe("single request", () => {
			it("uses direct transport.request for single request", async () => {
				const transport = createMockTransport();
				transport.request.mockReturnValue(Effect.succeed("0x123"));
				const resolver = makeRpcResolver(transport);

				const result = await Effect.runPromise(
					Effect.request(resolver)(new EthBlockNumber({})),
				);

				expect(result).toBe("0x123");
				expect(transport.request).toHaveBeenCalledWith("eth_blockNumber", []);
				expect(transport.request).toHaveBeenCalledTimes(1);
			});

			it("propagates error for single request failure", async () => {
				const transport = createMockTransport();
				const error = new TransportError({
					code: -32000,
					message: "rate limited",
				});
				transport.request.mockReturnValue(Effect.fail(error));
				const resolver = makeRpcResolver(transport);

				const result = await Effect.runPromise(
					Effect.request(resolver)(new EthBlockNumber({})).pipe(Effect.either),
				);

				expect(result._tag).toBe("Left");
				if (result._tag === "Left") {
					expect(result.left).toBeInstanceOf(TransportError);
					expect((result.left as TransportError).code).toBe(-32000);
				}
			});
		});

		describe("batch request encoding", () => {
			it("encodes multiple requests as JSON-RPC batch", async () => {
				const transport = createMockTransport();
				transport.request.mockReturnValue(
					Effect.succeed([
						{ jsonrpc: "2.0", id: 0, result: "0x100" },
						{ jsonrpc: "2.0", id: 1, result: "0x200" },
					]),
				);
				const resolver = makeRpcResolver(transport);

				const [blockNumber, balance] = await Effect.runPromise(
					Effect.all(
						[
							Effect.request(resolver)(new EthBlockNumber({})),
							Effect.request(resolver)(
								new EthGetBalance({ address: "0xabc", blockTag: "latest" }),
							),
						],
						{ batching: true },
					),
				);

				expect(blockNumber).toBe("0x100");
				expect(balance).toBe("0x200");
				expect(transport.request).toHaveBeenCalledWith("__batch__", [
					{ jsonrpc: "2.0", id: 0, method: "eth_blockNumber", params: [] },
					{
						jsonrpc: "2.0",
						id: 1,
						method: "eth_getBalance",
						params: ["0xabc", "latest"],
					},
				]);
			});
		});

		describe("batch error handling", () => {
			it("returns TransportError -32603 for missing response id", async () => {
				const transport = createMockTransport();
				transport.request.mockReturnValue(
					Effect.succeed([{ jsonrpc: "2.0", id: 0, result: "0x100" }]),
				);
				const resolver = makeRpcResolver(transport);

				const results = await Effect.runPromise(
					Effect.all(
						[
							Effect.request(resolver)(new EthBlockNumber({})).pipe(
								Effect.either,
							),
							Effect.request(resolver)(
								new EthGetBalance({ address: "0xabc", blockTag: "latest" }),
							).pipe(Effect.either),
						],
						{ batching: true },
					),
				);

				expect(results[0]._tag).toBe("Right");
				expect(results[1]._tag).toBe("Left");
				if (results[1]._tag === "Left") {
					const err = results[1].left as TransportError;
					expect(err.code).toBe(-32603);
					expect(err.message).toContain("Missing response for request id 1");
				}
			});

			it("maps response.error to TransportError with code/message", async () => {
				const transport = createMockTransport();
				transport.request.mockReturnValue(
					Effect.succeed([
						{ jsonrpc: "2.0", id: 0, result: "0x100" },
						{
							jsonrpc: "2.0",
							id: 1,
							error: {
								code: -32602,
								message: "invalid params",
								data: { foo: "bar" },
							},
						},
					]),
				);
				const resolver = makeRpcResolver(transport);

				const results = await Effect.runPromise(
					Effect.all(
						[
							Effect.request(resolver)(new EthBlockNumber({})).pipe(
								Effect.either,
							),
							Effect.request(resolver)(
								new EthGetBalance({ address: "0xabc", blockTag: "latest" }),
							).pipe(Effect.either),
						],
						{ batching: true },
					),
				);

				expect(results[0]._tag).toBe("Right");
				expect(results[1]._tag).toBe("Left");
				if (results[1]._tag === "Left") {
					const err = results[1].left as TransportError;
					expect(err.code).toBe(-32602);
					expect(err.message).toBe("invalid params");
					expect(err.data).toEqual({ foo: "bar" });
				}
			});

			it("fails all requests when batch transport fails", async () => {
				const transport = createMockTransport();
				const error = new TransportError({
					code: -32603,
					message: "network error",
				});
				transport.request.mockReturnValue(Effect.fail(error));
				const resolver = makeRpcResolver(transport);

				const results = await Effect.runPromise(
					Effect.all(
						[
							Effect.request(resolver)(new EthBlockNumber({})).pipe(
								Effect.either,
							),
							Effect.request(resolver)(
								new EthGetBalance({ address: "0xabc", blockTag: "latest" }),
							).pipe(Effect.either),
						],
						{ batching: true },
					),
				);

				expect(results[0]._tag).toBe("Left");
				expect(results[1]._tag).toBe("Left");
			});
		});

		describe("request type encoding", () => {
			it("encodes EthBlockNumber", async () => {
				const transport = createMockTransport();
				transport.request.mockReturnValue(Effect.succeed("0x1"));
				const resolver = makeRpcResolver(transport);

				await Effect.runPromise(
					Effect.request(resolver)(new EthBlockNumber({})),
				);

				expect(transport.request).toHaveBeenCalledWith("eth_blockNumber", []);
			});

			it("encodes EthGetBalance", async () => {
				const transport = createMockTransport();
				transport.request.mockReturnValue(Effect.succeed("0x1"));
				const resolver = makeRpcResolver(transport);

				await Effect.runPromise(
					Effect.request(resolver)(
						new EthGetBalance({ address: "0xabc", blockTag: "pending" }),
					),
				);

				expect(transport.request).toHaveBeenCalledWith("eth_getBalance", [
					"0xabc",
					"pending",
				]);
			});

			it("encodes EthCall with all fields", async () => {
				const transport = createMockTransport();
				transport.request.mockReturnValue(Effect.succeed("0x"));
				const resolver = makeRpcResolver(transport);

				await Effect.runPromise(
					Effect.request(resolver)(
						new EthCall({
							to: "0xcontract",
							data: "0xabcd",
							from: "0xsender",
							gas: "0x5208",
							gasPrice: "0x3b9aca00",
							value: "0x0",
							blockTag: "latest",
						}),
					),
				);

				expect(transport.request).toHaveBeenCalledWith("eth_call", [
					{
						to: "0xcontract",
						data: "0xabcd",
						from: "0xsender",
						gas: "0x5208",
						gasPrice: "0x3b9aca00",
						value: "0x0",
					},
					"latest",
				]);
			});

			it("encodes EthCall with minimal fields", async () => {
				const transport = createMockTransport();
				transport.request.mockReturnValue(Effect.succeed("0x"));
				const resolver = makeRpcResolver(transport);

				await Effect.runPromise(
					Effect.request(resolver)(
						new EthCall({ to: "0xcontract", blockTag: "latest" }),
					),
				);

				expect(transport.request).toHaveBeenCalledWith("eth_call", [
					{ to: "0xcontract" },
					"latest",
				]);
			});

			it("encodes EthGetLogs", async () => {
				const transport = createMockTransport();
				transport.request.mockReturnValue(Effect.succeed([]));
				const resolver = makeRpcResolver(transport);

				await Effect.runPromise(
					Effect.request(resolver)(
						new EthGetLogs({
							address: "0xcontract",
							topics: ["0xtopic1", null],
							fromBlock: "0x1",
							toBlock: "latest",
						}),
					),
				);

				expect(transport.request).toHaveBeenCalledWith("eth_getLogs", [
					{
						address: "0xcontract",
						topics: ["0xtopic1", null],
						fromBlock: "0x1",
						toBlock: "latest",
					},
				]);
			});

			it("encodes GenericRpcRequest", async () => {
				const transport = createMockTransport();
				transport.request.mockReturnValue(Effect.succeed("0x1"));
				const resolver = makeRpcResolver(transport);

				await Effect.runPromise(
					Effect.request(resolver)(
						new GenericRpcRequest({
							method: "eth_syncing",
							params: [],
						}),
					),
				);

				expect(transport.request).toHaveBeenCalledWith("eth_syncing", []);
			});
		});
	});
});

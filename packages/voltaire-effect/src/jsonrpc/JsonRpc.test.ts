import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import {
	Anvil,
	BatchRequest,
	BatchResponse,
	CHAIN_DISCONNECTED,
	DISCONNECTED,
	Eth,
	EXECUTION_REVERTED,
	ExecutionRevertedError,
	Hardhat,
	IdCounterLive,
	INSUFFICIENT_FUNDS,
	InsufficientFundsError,
	isDisconnected,
	isExecutionReverted,
	isInsufficientFunds,
	isNonceError,
	isProviderError,
	isUserRejected,
	JsonRpcError,
	JsonRpcParseError,
	Net,
	NONCE_TOO_HIGH,
	NONCE_TOO_LOW,
	NonceTooHighError,
	NonceTooLowError,
	parseErrorCode,
	Request,
	Response,
	Txpool,
	USER_REJECTED_REQUEST,
	Wallet,
	Web3,
} from "./index.js";

describe("JsonRpc", () => {
	describe("Request", () => {
		it("creates a request from object", () => {
			const req = Request.from({
				method: "eth_blockNumber",
				params: [],
				id: 1,
			});
			expect(req.jsonrpc).toBe("2.0");
			expect(req.method).toBe("eth_blockNumber");
			expect(req.params).toEqual([]);
			expect(req.id).toBe(1);
		});

		it("creates a notification (no id)", () => {
			const req = Request.from({
				method: "eth_subscribe",
				params: ["newHeads"],
			});
			expect(req.id).toBeUndefined();
			expect(Request.isNotification(req)).toBe(true);
		});

		it("isNotification returns false for regular request", () => {
			const req = Request.from({
				method: "eth_blockNumber",
				id: 1,
			});
			expect(Request.isNotification(req)).toBe(false);
		});

		it("withParams adds parameters to request", async () => {
			const base = Request.from({ method: "eth_getBalance", id: 1 });
			const addParams = Request.withParams<[string, string]>(base);
			const program = addParams(["0x1234", "latest"]).pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.params).toEqual(["0x1234", "latest"]);
		});

		it("creates request with string id", () => {
			const req = Request.from({
				method: "eth_blockNumber",
				id: "request-abc",
			});
			expect(req.id).toBe("request-abc");
		});

		it("creates request with null id", () => {
			const req = Request.from({
				method: "eth_blockNumber",
				id: null,
			});
			expect(req.id).toBeNull();
			expect(Request.isNotification(req)).toBe(false);
		});

		it("isNotification returns false for null id", () => {
			const req = Request.from({
				method: "eth_subscribe",
				id: null,
			});
			expect(Request.isNotification(req)).toBe(false);
		});

		it("withParams auto-assigns id when undefined", async () => {
			const base = Request.from({ method: "eth_getBalance" });
			const addParams = Request.withParams<[string, string]>(base);
			const program = addParams(["0x1234", "latest"]).pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.id).toBeDefined();
			expect(typeof req.id).toBe("number");
		});

		it("creates request with empty method", () => {
			const req = Request.from({ method: "", id: 1 });
			expect(req.method).toBe("");
		});

		it("creates request with complex params", () => {
			const req = Request.from({
				method: "eth_call",
				params: [{ to: "0x123", data: "0xabc" }, "latest"],
				id: 1,
			});
			expect(req.params).toEqual([{ to: "0x123", data: "0xabc" }, "latest"]);
		});
	});

	describe("Response", () => {
		it("parses success response", async () => {
			const raw = {
				jsonrpc: "2.0",
				id: 1,
				result: "0x1234",
			};

			const program = Response.parse(raw);
			const response = await Effect.runPromise(program);
			expect(Response.isSuccess(response)).toBe(true);
			if (Response.isSuccess(response)) {
				expect(response.result).toBe("0x1234");
			}
		});

		it("parses error response", async () => {
			const raw = {
				jsonrpc: "2.0",
				id: 1,
				error: {
					code: -32601,
					message: "Method not found",
				},
			};

			const program = Response.parse(raw);
			const response = await Effect.runPromise(program);
			expect(Response.isError(response)).toBe(true);
			if (Response.isError(response)) {
				expect(response.error.code).toBe(-32601);
			}
		});

		it("unwrap extracts result from success", async () => {
			const raw = {
				jsonrpc: "2.0",
				id: 1,
				result: "0x5678",
			};

			const program = Effect.gen(function* () {
				const response = yield* Response.parse(raw);
				return yield* Response.unwrap(response);
			});

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x5678");
		});

		it("unwrap fails on error response", async () => {
			const raw = {
				jsonrpc: "2.0",
				id: 1,
				error: {
					code: -32000,
					message: "execution reverted",
				},
			};

			const program = Effect.gen(function* () {
				const response = yield* Response.parse(raw);
				return yield* Response.unwrap(response);
			});

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});

		it("parse fails on invalid response", async () => {
			const raw = { invalid: "data" };

			const program = Response.parse(raw);
			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});

		it("parse fails on invalid jsonrpc version", async () => {
			const raw = { jsonrpc: "1.0", id: 1, result: "0x1" };

			const program = Response.parse(raw);
			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});

		it("parses response with null id", async () => {
			const raw = { jsonrpc: "2.0", id: null, result: "0x1" };

			const response = await Effect.runPromise(Response.parse(raw));
			expect(response.id).toBeNull();
		});

		it("parses response with string id", async () => {
			const raw = { jsonrpc: "2.0", id: "abc-123", result: "0x1" };

			const response = await Effect.runPromise(Response.parse(raw));
			expect(response.id).toBe("abc-123");
		});

		it("parses response with number id", async () => {
			const raw = { jsonrpc: "2.0", id: 42, result: "0x1" };

			const response = await Effect.runPromise(Response.parse(raw));
			expect(response.id).toBe(42);
		});

		it("parse fails when result and error are both present", async () => {
			const raw = {
				jsonrpc: "2.0",
				id: 1,
				result: "0x1",
				error: { code: -32000, message: "Something failed" },
			};

			const exit = await Effect.runPromiseExit(Response.parse(raw));
			expect(exit._tag).toBe("Failure");
		});

		it("parses error response with data field", async () => {
			const raw = {
				jsonrpc: "2.0",
				id: 1,
				error: {
					code: -32000,
					message: "execution reverted",
					data: { reason: "insufficient funds", value: "0x1234" },
				},
			};

			const response = await Effect.runPromise(Response.parse(raw));
			expect(Response.isError(response)).toBe(true);
			if (Response.isError(response)) {
				expect(response.error.data).toEqual({
					reason: "insufficient funds",
					value: "0x1234",
				});
			}
		});

		it("parse fails when missing id field", async () => {
			const raw = { jsonrpc: "2.0", result: "0x1" };
			const exit = await Effect.runPromiseExit(Response.parse(raw));
			expect(exit._tag).toBe("Failure");
		});

		it("parse fails when neither result nor error present", async () => {
			const raw = { jsonrpc: "2.0", id: 1 };
			const exit = await Effect.runPromiseExit(Response.parse(raw));
			expect(exit._tag).toBe("Failure");
		});

		it("parse fails when id is invalid type (boolean)", async () => {
			const raw = { jsonrpc: "2.0", id: true, result: "0x1" };
			const exit = await Effect.runPromiseExit(Response.parse(raw));
			expect(exit._tag).toBe("Failure");
		});

		it("parse fails when id is invalid type (object)", async () => {
			const raw = { jsonrpc: "2.0", id: { key: "value" }, result: "0x1" };
			const exit = await Effect.runPromiseExit(Response.parse(raw));
			expect(exit._tag).toBe("Failure");
		});

		it("parse fails when id is invalid type (array)", async () => {
			const raw = { jsonrpc: "2.0", id: [1, 2], result: "0x1" };
			const exit = await Effect.runPromiseExit(Response.parse(raw));
			expect(exit._tag).toBe("Failure");
		});

		it("parse fails on null input", async () => {
			const exit = await Effect.runPromiseExit(Response.parse(null));
			expect(exit._tag).toBe("Failure");
		});

		it("parse fails on array input", async () => {
			const exit = await Effect.runPromiseExit(Response.parse([1, 2, 3]));
			expect(exit._tag).toBe("Failure");
		});
	});

	describe("Error", () => {
		it("creates error from object", () => {
			const error = JsonRpcError.from({
				code: -32603,
				message: "Internal error",
			});
			expect(error.code).toBe(-32603);
			expect(error.message).toBe("Internal error");
		});

		it("includes data field", () => {
			const error = JsonRpcError.from({
				code: -32000,
				message: "execution reverted",
				data: "0x08c379a0",
			});
			expect(error.data).toBe("0x08c379a0");
		});

		it("toString formats error", () => {
			const error = JsonRpcError.from({
				code: -32601,
				message: "Method not found",
			});
			const str = JsonRpcError.toString(error);
			expect(str).toContain("-32601");
			expect(str).toContain("Method not found");
		});

		it("exposes standard error codes", () => {
			expect(JsonRpcError.PARSE_ERROR).toBe(-32700);
			expect(JsonRpcError.INVALID_REQUEST).toBe(-32600);
			expect(JsonRpcError.METHOD_NOT_FOUND).toBe(-32601);
			expect(JsonRpcError.INVALID_PARAMS).toBe(-32602);
			expect(JsonRpcError.INTERNAL_ERROR).toBe(-32603);
		});

		it("exposes Ethereum-specific codes", () => {
			expect(JsonRpcError.INVALID_INPUT).toBe(-32000);
			expect(JsonRpcError.RESOURCE_NOT_FOUND).toBe(-32001);
			expect(JsonRpcError.RESOURCE_UNAVAILABLE).toBe(-32002);
			expect(JsonRpcError.TRANSACTION_REJECTED).toBe(-32003);
		});
	});

	describe("BatchRequest", () => {
		it("creates batch from array", () => {
			const batch = BatchRequest.from([
				Request.from({ method: "eth_blockNumber", id: 1 }),
				Request.from({ method: "eth_chainId", id: 2 }),
			]);
			expect(BatchRequest.size(batch)).toBe(2);
		});

		it("adds request to batch", () => {
			const batch = BatchRequest.from([
				Request.from({ method: "eth_blockNumber", id: 1 }),
			]);
			const addReq = BatchRequest.add(batch);
			const updated = addReq(Request.from({ method: "eth_chainId", id: 2 }));
			expect(BatchRequest.size(updated)).toBe(2);
		});
	});

	describe("BatchResponse", () => {
		it("parses batch response array", async () => {
			const raw = [
				{ jsonrpc: "2.0", id: 1, result: "0x1" },
				{ jsonrpc: "2.0", id: 2, result: "0x2" },
			];

			const program = BatchResponse.parse(raw);
			const batch = await Effect.runPromise(program);
			expect(BatchResponse.results(batch)).toHaveLength(2);
		});

		it("findById locates response", async () => {
			const raw = [
				{ jsonrpc: "2.0", id: 1, result: "0x1" },
				{ jsonrpc: "2.0", id: 2, result: "0x2" },
			];

			const program = BatchResponse.parse(raw);
			const batch = await Effect.runPromise(program);
			const findById = BatchResponse.findById(batch);
			const response = findById(2);
			expect(
				response && "result" in response ? response.result : undefined,
			).toBe("0x2");
		});

		it("errors returns only error responses", async () => {
			const raw = [
				{ jsonrpc: "2.0", id: 1, result: "0x1" },
				{
					jsonrpc: "2.0",
					id: 2,
					error: { code: -32601, message: "Not found" },
				},
			];

			const program = BatchResponse.parse(raw);
			const batch = await Effect.runPromise(program);
			const errors = BatchResponse.errors(batch);
			expect(errors).toHaveLength(1);
			expect(errors[0].error.code).toBe(-32601);
		});

		it("parse fails when batch is not an array", async () => {
			const raw = { jsonrpc: "2.0", id: 1, result: "0x1" };

			const exit = await Effect.runPromiseExit(BatchResponse.parse(raw));
			expect(exit._tag).toBe("Failure");
		});

		it("parses empty array", async () => {
			const raw: unknown[] = [];

			const batch = await Effect.runPromise(BatchResponse.parse(raw));
			expect(BatchResponse.results(batch)).toHaveLength(0);
		});

		it("parse fails when batch contains invalid entries", async () => {
			const raw = [
				{ jsonrpc: "2.0", id: 1, result: "0x1" },
				{ invalid: "entry" },
				{ jsonrpc: "2.0", id: 2, result: "0x2" },
			];

			const exit = await Effect.runPromiseExit(BatchResponse.parse(raw));
			expect(exit._tag).toBe("Failure");
		});

		it("findById with duplicate ids returns first match", async () => {
			const raw = [
				{ jsonrpc: "2.0", id: 1, result: "0x1" },
				{ jsonrpc: "2.0", id: 1, result: "0x2" },
			];

			const batch = await Effect.runPromise(BatchResponse.parse(raw));
			const findById = BatchResponse.findById(batch);
			const response = findById(1);
			expect(
				response && "result" in response ? response.result : undefined,
			).toBe("0x1");
		});

		it("findById with null id", async () => {
			const raw = [
				{ jsonrpc: "2.0", id: null, result: "0x1" },
				{ jsonrpc: "2.0", id: 2, result: "0x2" },
			];

			const batch = await Effect.runPromise(BatchResponse.parse(raw));
			const findById = BatchResponse.findById(batch);
			const response = findById(null);
			expect(
				response && "result" in response ? response.result : undefined,
			).toBe("0x1");
		});

		it("findById with string id", async () => {
			const raw = [
				{ jsonrpc: "2.0", id: "req-1", result: "0x1" },
				{ jsonrpc: "2.0", id: "req-2", result: "0x2" },
			];

			const batch = await Effect.runPromise(BatchResponse.parse(raw));
			const findById = BatchResponse.findById(batch);
			const response = findById("req-2");
			expect(
				response && "result" in response ? response.result : undefined,
			).toBe("0x2");
		});
	});

	describe("Eth namespace", () => {
		it("creates GetBalanceRequest", async () => {
			const program = Eth.GetBalanceRequest("0x1234", "latest").pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("eth_getBalance");
			expect(req.params).toEqual(["0x1234", "latest"]);
		});

		it("creates BlockNumberRequest", async () => {
			const program = Eth.BlockNumberRequest().pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("eth_blockNumber");
		});

		it("creates ChainIdRequest", async () => {
			const program = Eth.ChainIdRequest().pipe(Effect.provide(IdCounterLive));
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("eth_chainId");
		});

		it("creates CallRequest", async () => {
			const program = Eth.CallRequest(
				{ to: "0xabc", data: "0x123" },
				"latest",
			).pipe(Effect.provide(IdCounterLive));
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("eth_call");
		});

		it("creates GetBlockByNumberRequest", async () => {
			const program = Eth.GetBlockByNumberRequest("0x1", false).pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("eth_getBlockByNumber");
			expect(req.params).toEqual(["0x1", false]);
		});
	});

	describe("Wallet namespace", () => {
		it("creates SwitchEthereumChainRequest", async () => {
			const program = Wallet.SwitchEthereumChainRequest("0x1").pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("wallet_switchEthereumChain");
		});
	});

	describe("Net namespace", () => {
		it("creates VersionRequest", async () => {
			const program = Net.VersionRequest().pipe(Effect.provide(IdCounterLive));
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("net_version");
		});

		it("creates ListeningRequest", async () => {
			const program = Net.ListeningRequest().pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("net_listening");
		});

		it("creates PeerCountRequest", async () => {
			const program = Net.PeerCountRequest().pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("net_peerCount");
		});
	});

	describe("Web3 namespace", () => {
		it("creates ClientVersionRequest", async () => {
			const program = Web3.ClientVersionRequest().pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("web3_clientVersion");
		});

		it("creates Sha3Request", async () => {
			const program = Web3.Sha3Request("0x68656c6c6f").pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("web3_sha3");
			expect(req.params).toEqual(["0x68656c6c6f"]);
		});
	});

	describe("Txpool namespace", () => {
		it("creates StatusRequest", async () => {
			const program = Txpool.StatusRequest().pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("txpool_status");
		});

		it("creates ContentRequest", async () => {
			const program = Txpool.ContentRequest().pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("txpool_content");
		});

		it("creates InspectRequest", async () => {
			const program = Txpool.InspectRequest().pipe(
				Effect.provide(IdCounterLive),
			);
			const req = await Effect.runPromise(program);
			expect(req.method).toBe("txpool_inspect");
		});
	});

	describe("JsonRpcParseError", () => {
		it("is tagged correctly", () => {
			const error = new JsonRpcParseError({ raw: "bad data" }, "Parse failed");
			expect(error._tag).toBe("JsonRpcParseError");
			expect(error.message).toBe("Parse failed");
		});
	});

	describe("ID Counter", () => {
		it("generates unique IDs across namespaces", async () => {
			const program = Effect.gen(function* () {
				const ids = new Set<number>();

				// Generate requests from multiple namespaces
				const req1 = yield* Eth.BlockNumberRequest();
				ids.add(req1.id as number);
				const req2 = yield* Eth.ChainIdRequest();
				ids.add(req2.id as number);
				const req3 = yield* Net.VersionRequest();
				ids.add(req3.id as number);
				const req4 = yield* Web3.ClientVersionRequest();
				ids.add(req4.id as number);
				const req5 = yield* Txpool.StatusRequest();
				ids.add(req5.id as number);
				const req6 = yield* Wallet.GetPermissionsRequest();
				ids.add(req6.id as number);
				const req7 = yield* Anvil.GetAutomineRequest();
				ids.add(req7.id as number);
				const req8 = yield* Hardhat.MineRequest();
				ids.add(req8.id as number);

				return ids;
			}).pipe(Effect.provide(IdCounterLive));

			const ids = await Effect.runPromise(program);
			// All 8 IDs should be unique
			expect(ids.size).toBe(8);
		});

		it("increments IDs sequentially", async () => {
			const program = Effect.gen(function* () {
				const req1 = yield* Eth.BlockNumberRequest();
				const req2 = yield* Net.VersionRequest();
				const req3 = yield* Web3.ClientVersionRequest();

				return {
					id1: req1.id as number,
					id2: req2.id as number,
					id3: req3.id as number,
				};
			}).pipe(Effect.provide(IdCounterLive));

			const { id1, id2, id3 } = await Effect.runPromise(program);
			expect(id2).toBe(id1 + 1);
			expect(id3).toBe(id2 + 1);
		});

		it("isolated counter starts fresh", async () => {
			const program = Effect.gen(function* () {
				const req = yield* Eth.BlockNumberRequest();
				return req.id as number;
			}).pipe(Effect.provide(IdCounterLive));

			const id = await Effect.runPromise(program);
			expect(id).toBe(1);
		});
	});

	describe("EIP-1193 Provider Error Codes", () => {
		it("exposes EIP-1193 provider error codes", () => {
			expect(JsonRpcError.USER_REJECTED_REQUEST).toBe(4001);
			expect(JsonRpcError.UNAUTHORIZED).toBe(4100);
			expect(JsonRpcError.UNSUPPORTED_METHOD).toBe(4200);
			expect(JsonRpcError.DISCONNECTED).toBe(4900);
			expect(JsonRpcError.CHAIN_DISCONNECTED).toBe(4901);
		});

		it("exposes node-specific error codes", () => {
			expect(JsonRpcError.EXECUTION_REVERTED).toBe(3);
			expect(JsonRpcError.INSUFFICIENT_FUNDS).toBe(-32010);
			expect(JsonRpcError.NONCE_TOO_LOW).toBe(-32011);
			expect(JsonRpcError.NONCE_TOO_HIGH).toBe(-32012);
		});

		it("isUserRejected helper", () => {
			expect(isUserRejected(USER_REJECTED_REQUEST)).toBe(true);
			expect(isUserRejected(4002)).toBe(false);
			expect(isUserRejected(-32000)).toBe(false);
		});

		it("isDisconnected helper", () => {
			expect(isDisconnected(DISCONNECTED)).toBe(true);
			expect(isDisconnected(CHAIN_DISCONNECTED)).toBe(true);
			expect(isDisconnected(4001)).toBe(false);
		});

		it("isProviderError helper", () => {
			expect(isProviderError(4001)).toBe(true);
			expect(isProviderError(4100)).toBe(true);
			expect(isProviderError(4999)).toBe(true);
			expect(isProviderError(3999)).toBe(false);
			expect(isProviderError(5000)).toBe(false);
			expect(isProviderError(-32000)).toBe(false);
		});

		it("isExecutionReverted helper", () => {
			expect(isExecutionReverted(EXECUTION_REVERTED)).toBe(true);
			expect(isExecutionReverted(3)).toBe(true);
			expect(isExecutionReverted(-32000)).toBe(false);
		});

		it("isNonceError helper", () => {
			expect(isNonceError(NONCE_TOO_LOW)).toBe(true);
			expect(isNonceError(NONCE_TOO_HIGH)).toBe(true);
			expect(isNonceError(-32010)).toBe(false);
			expect(isNonceError(-32000)).toBe(false);
		});

		it("isInsufficientFunds helper", () => {
			expect(isInsufficientFunds(INSUFFICIENT_FUNDS)).toBe(true);
			expect(isInsufficientFunds(-32010)).toBe(true);
			expect(isInsufficientFunds(-32011)).toBe(false);
		});
	});

	describe("Node-specific Error Classes", () => {
		it("ExecutionRevertedError has correct tag and code", () => {
			const error = new ExecutionRevertedError("Contract reverted");
			expect(error._tag).toBe("ExecutionRevertedError");
			expect(error.rpcCode).toBe(3);
			expect(error.message).toBe("Contract reverted");
		});

		it("ExecutionRevertedError default message", () => {
			const error = new ExecutionRevertedError();
			expect(error.message).toBe("Execution reverted");
		});

		it("InsufficientFundsError has correct tag and code", () => {
			const error = new InsufficientFundsError("Not enough ETH");
			expect(error._tag).toBe("InsufficientFundsError");
			expect(error.rpcCode).toBe(-32010);
			expect(error.message).toBe("Not enough ETH");
		});

		it("InsufficientFundsError default message", () => {
			const error = new InsufficientFundsError();
			expect(error.message).toBe("Insufficient funds for gas * price + value");
		});

		it("NonceTooLowError has correct tag and code", () => {
			const error = new NonceTooLowError("Nonce already used");
			expect(error._tag).toBe("NonceTooLowError");
			expect(error.rpcCode).toBe(-32011);
			expect(error.message).toBe("Nonce already used");
		});

		it("NonceTooLowError default message", () => {
			const error = new NonceTooLowError();
			expect(error.message).toBe("Nonce too low");
		});

		it("NonceTooHighError has correct tag and code", () => {
			const error = new NonceTooHighError("Nonce gap detected");
			expect(error._tag).toBe("NonceTooHighError");
			expect(error.rpcCode).toBe(-32012);
			expect(error.message).toBe("Nonce gap detected");
		});

		it("NonceTooHighError default message", () => {
			const error = new NonceTooHighError();
			expect(error.message).toBe("Nonce too high");
		});

		it("error classes accept data option", () => {
			const error = new ExecutionRevertedError("reverted", {
				data: "0x08c379a0000000",
			});
			expect(error.data).toBe("0x08c379a0000000");
		});
	});

	describe("parseErrorCode", () => {
		it("parses execution reverted code", () => {
			const error = parseErrorCode({ code: 3, message: "revert" });
			expect(error._tag).toBe("ExecutionRevertedError");
		});

		it("parses insufficient funds code", () => {
			const error = parseErrorCode({ code: -32010 });
			expect(error._tag).toBe("InsufficientFundsError");
		});

		it("parses nonce too low code", () => {
			const error = parseErrorCode({ code: -32011 });
			expect(error._tag).toBe("NonceTooLowError");
		});

		it("parses nonce too high code", () => {
			const error = parseErrorCode({ code: -32012 });
			expect(error._tag).toBe("NonceTooHighError");
		});

		it("parses unknown code as JsonRpcErrorResponse", () => {
			const error = parseErrorCode({ code: -99999, message: "Unknown" });
			expect(error._tag).toBe("JsonRpcError");
		});
	});
});

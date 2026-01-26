import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import {
	BatchRequest,
	BatchResponse,
	Eth,
	JsonRpcError,
	JsonRpcParseError,
	Net,
	Request,
	Response,
	Txpool,
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

		it("withParams adds parameters to request", () => {
			const base = Request.from({ method: "eth_getBalance", id: 1 });
			const addParams = Request.withParams<[string, string]>(base);
			const req = addParams(["0x1234", "latest"]);
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

		it("withParams auto-assigns id when undefined", () => {
			const base = Request.from({ method: "eth_getBalance" });
			const addParams = Request.withParams<[string, string]>(base);
			const req = addParams(["0x1234", "latest"]);
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
			expect(response && "result" in response ? response.result : undefined).toBe("0x2");
		});

		it("errors returns only error responses", async () => {
			const raw = [
				{ jsonrpc: "2.0", id: 1, result: "0x1" },
				{ jsonrpc: "2.0", id: 2, error: { code: -32601, message: "Not found" } },
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
			expect(response && "result" in response ? response.result : undefined).toBe("0x1");
			});

			it("findById with null id", async () => {
			const raw = [
				{ jsonrpc: "2.0", id: null, result: "0x1" },
				{ jsonrpc: "2.0", id: 2, result: "0x2" },
			];

			const batch = await Effect.runPromise(BatchResponse.parse(raw));
			const findById = BatchResponse.findById(batch);
			const response = findById(null);
			expect(response && "result" in response ? response.result : undefined).toBe("0x1");
			});

			it("findById with string id", async () => {
			const raw = [
				{ jsonrpc: "2.0", id: "req-1", result: "0x1" },
				{ jsonrpc: "2.0", id: "req-2", result: "0x2" },
			];

			const batch = await Effect.runPromise(BatchResponse.parse(raw));
			const findById = BatchResponse.findById(batch);
			const response = findById("req-2");
			expect(response && "result" in response ? response.result : undefined).toBe("0x2");
			});
			});

			describe("Eth namespace", () => {
		it("creates GetBalanceRequest", () => {
			const req = Eth.GetBalanceRequest("0x1234", "latest");
			expect(req.method).toBe("eth_getBalance");
			expect(req.params).toEqual(["0x1234", "latest"]);
		});

		it("creates BlockNumberRequest", () => {
			const req = Eth.BlockNumberRequest();
			expect(req.method).toBe("eth_blockNumber");
		});

		it("creates ChainIdRequest", () => {
			const req = Eth.ChainIdRequest();
			expect(req.method).toBe("eth_chainId");
		});

		it("creates CallRequest", () => {
			const req = Eth.CallRequest({ to: "0xabc", data: "0x123" }, "latest");
			expect(req.method).toBe("eth_call");
		});

		it("creates GetBlockByNumberRequest", () => {
			const req = Eth.GetBlockByNumberRequest("0x1", false);
			expect(req.method).toBe("eth_getBlockByNumber");
			expect(req.params).toEqual(["0x1", false]);
		});
	});

	describe("Wallet namespace", () => {
		it("creates SwitchEthereumChainRequest", () => {
			const req = Wallet.SwitchEthereumChainRequest("0x1");
			expect(req.method).toBe("wallet_switchEthereumChain");
		});
	});

	describe("Net namespace", () => {
		it("creates VersionRequest", () => {
			const req = Net.VersionRequest();
			expect(req.method).toBe("net_version");
		});

		it("creates ListeningRequest", () => {
			const req = Net.ListeningRequest();
			expect(req.method).toBe("net_listening");
		});

		it("creates PeerCountRequest", () => {
			const req = Net.PeerCountRequest();
			expect(req.method).toBe("net_peerCount");
		});
	});

	describe("Web3 namespace", () => {
		it("creates ClientVersionRequest", () => {
			const req = Web3.ClientVersionRequest();
			expect(req.method).toBe("web3_clientVersion");
		});

		it("creates Sha3Request", () => {
			const req = Web3.Sha3Request("0x68656c6c6f");
			expect(req.method).toBe("web3_sha3");
			expect(req.params).toEqual(["0x68656c6c6f"]);
		});
	});

	describe("Txpool namespace", () => {
		it("creates StatusRequest", () => {
			const req = Txpool.StatusRequest();
			expect(req.method).toBe("txpool_status");
		});

		it("creates ContentRequest", () => {
			const req = Txpool.ContentRequest();
			expect(req.method).toBe("txpool_content");
		});

		it("creates InspectRequest", () => {
			const req = Txpool.InspectRequest();
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
});

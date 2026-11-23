import { runBenchSuite } from "../bench-harness.js";
import * as BatchRequest from "./BatchRequest/index.js";
import * as BatchResponse from "./BatchResponse/index.js";
import * as eth from "./eth/methods.js";
import * as JsonRpcRequest from "./JsonRpcRequest/index.js";
import * as JsonRpcResponse from "./JsonRpcResponse/index.js";

const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" as never;
const req = JsonRpcRequest.from({ method: "eth_blockNumber", id: 1 });
const reqs = [
	JsonRpcRequest.from({ method: "eth_blockNumber", id: 1 }),
	JsonRpcRequest.from({ method: "eth_chainId", id: 2 }),
	JsonRpcRequest.from({ method: "eth_gasPrice", id: 3 }),
];
const resps = [
	JsonRpcResponse.from({ id: 1, result: "0x100" }),
	JsonRpcResponse.from({ id: 2, result: "0x1" }),
	JsonRpcResponse.from({ id: 3, result: "0x3b9aca00" }),
];
const batchResp = BatchResponse.from(resps);

await runBenchSuite("voltaire-ts:jsonrpc", [
	{
		name: "eth.GetBalanceRequest",
		fn: () => eth.GetBalanceRequest(addr, "latest"),
	},
	{ name: "eth.BlockNumberRequest", fn: () => eth.BlockNumberRequest() },
	{
		name: "JsonRpcRequest.from",
		fn: () => JsonRpcRequest.from({ method: "eth_blockNumber", id: 1 }),
	},
	{
		name: "JsonRpcResponse.from",
		fn: () => JsonRpcResponse.from({ id: 1, result: "0x100" }),
	},
	{ name: "BatchRequest.from (3)", fn: () => BatchRequest.from(reqs) },
	{ name: "BatchResponse.from (3)", fn: () => BatchResponse.from(resps) },
	{
		name: "BatchResponse.findById",
		fn: () => BatchResponse.findById(batchResp, 2),
	},
	{ name: "JSON.stringify(req)", fn: () => JSON.stringify(req) },
]);

import { runBenchSuite } from "../../bench-harness.js";
import { FeeOracle } from "./index.js";

const mockProvider = {
	request: async ({ method }: { method: string }) => {
		if (method === "eth_gasPrice") return "0x3b9aca00";
		if (method === "eth_maxPriorityFeePerGas") return "0x59682f00";
		return { baseFeePerGas: "0x3b9aca00" };
	},
} as never;

await runBenchSuite("voltaire-ts:FeeOracle", [
	{ name: "FeeOracle.create", fn: () => FeeOracle({ provider: mockProvider }) },
]);

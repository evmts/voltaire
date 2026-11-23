import { runBenchSuite } from "../bench-harness.js";
import { InMemoryProvider } from "./InMemoryProvider.js";

const provider = new InMemoryProvider({ chainId: 1 });

await runBenchSuite("voltaire-ts:provider", [
	{
		name: "InMemoryProvider.eth_chainId",
		fn: () => provider.request({ method: "eth_chainId" }),
	},
	{
		name: "InMemoryProvider.eth_blockNumber",
		fn: () => provider.request({ method: "eth_blockNumber" }),
	},
	{
		name: "InMemoryProvider.eth_gasPrice",
		fn: () => provider.request({ method: "eth_gasPrice" }),
	},
]);

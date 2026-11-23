import { runBenchSuite } from "../../bench-harness.js";
import * as TransactionUrl from "./index.js";

const url =
	"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0@1?value=1000000000000000000";
const parsed = TransactionUrl.parse(url);

await runBenchSuite("voltaire-ts:TransactionUrl", [
	{ name: "TransactionUrl.parse", fn: () => TransactionUrl.parse(url) },
	{ name: "TransactionUrl.format", fn: () => TransactionUrl.format(parsed) },
]);

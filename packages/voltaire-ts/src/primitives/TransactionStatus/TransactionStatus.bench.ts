import { runBenchSuite } from "../../bench-harness.js";
import * as TransactionStatus from "./index.js";

const s = TransactionStatus.success(21000n as never);

await runBenchSuite("voltaire-ts:TransactionStatus", [
	{
		name: "TransactionStatus.success",
		fn: () => TransactionStatus.success(21000n as never),
	},
	{
		name: "TransactionStatus.isSuccess",
		fn: () => TransactionStatus.isSuccess(s),
	},
	{
		name: "TransactionStatus.isPending",
		fn: () => TransactionStatus.isPending(s),
	},
]);

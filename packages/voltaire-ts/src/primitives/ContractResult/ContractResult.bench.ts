import { runBenchSuite } from "../../bench-harness.js";
import * as ContractResult from "./index.js";

const data = new Uint8Array(32).fill(0x01);
const ok = ContractResult.success(data);

await runBenchSuite("voltaire-ts:ContractResult", [
	{ name: "ContractResult.success", fn: () => ContractResult.success(data) },
	{ name: "ContractResult.isSuccess", fn: () => ContractResult.isSuccess(ok) },
	{ name: "ContractResult.unwrap", fn: () => ContractResult.unwrap(ok) },
]);

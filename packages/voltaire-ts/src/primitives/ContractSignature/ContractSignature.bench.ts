import { runBenchSuite } from "../../bench-harness.js";
import * as ContractSignature from "./index.js";

await runBenchSuite("voltaire-ts:ContractSignature", [
	{
		name: "ERC1271_MAGIC_VALUE access",
		fn: () => ContractSignature.ERC1271_MAGIC_VALUE,
	},
]);

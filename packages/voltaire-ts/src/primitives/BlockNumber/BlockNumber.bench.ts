import { runBenchSuite } from "../../bench-harness.js";
import * as BlockNumber from "./index.js";

const n = BlockNumber.from(20_000_000n);

await runBenchSuite("voltaire-ts:BlockNumber", [
	{ name: "BlockNumber.from(bigint)", fn: () => BlockNumber.from(20_000_000n) },
	{ name: "BlockNumber.from(number)", fn: () => BlockNumber.from(20_000_000) },
	{ name: "BlockNumber.toBigInt", fn: () => BlockNumber.toBigInt(n) },
	{ name: "BlockNumber.toNumber", fn: () => BlockNumber.toNumber(n) },
]);

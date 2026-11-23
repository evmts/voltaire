import { runBenchSuite } from "../../bench-harness.js";
import * as Int8 from "./index.js";

const a = Int8.from(-42);
const b = Int8.from(17);

await runBenchSuite("voltaire-ts:Int8", [
	{ name: "Int8.from", fn: () => Int8.from(-42) },
	{ name: "Int8.fromHex", fn: () => Int8.fromHex("0xd6") },
	{ name: "Int8.plus", fn: () => Int8.plus(a, b) },
	{ name: "Int8.abs", fn: () => Int8.abs(a) },
	{ name: "Int8.toHex", fn: () => Int8.toHex(a) },
]);

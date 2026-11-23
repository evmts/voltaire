import { runBenchSuite } from "../../bench-harness.js";
import * as Int16 from "./index.js";

const a = Int16.from(-12345);
const b = Int16.from(6789);

await runBenchSuite("voltaire-ts:Int16", [
	{ name: "Int16.from", fn: () => Int16.from(-12345) },
	{ name: "Int16.fromHex", fn: () => Int16.fromHex("0xcfc7") },
	{ name: "Int16.plus", fn: () => Int16.plus(a, b) },
	{ name: "Int16.abs", fn: () => Int16.abs(a) },
	{ name: "Int16.toHex", fn: () => Int16.toHex(a) },
]);

import { runBenchSuite } from "../../bench-harness.js";
import * as Uint128 from "./index.js";

const a = Uint128.from(1_000_000_000_000_000_000n);
const b = Uint128.from(42_000_000_000n);
const bytes = Uint128.toBytes(a);

await runBenchSuite("voltaire-ts:Uint128", [
	{
		name: "Uint128.from(bigint)",
		fn: () => Uint128.from(1_000_000_000_000_000_000n),
	},
	{ name: "Uint128.fromHex", fn: () => Uint128.fromHex("0x0de0b6b3a7640000") },
	{ name: "Uint128.fromBytes", fn: () => Uint128.fromBytes(bytes) },
	{ name: "Uint128.plus", fn: () => Uint128.plus(a, b) },
	{ name: "Uint128.times", fn: () => Uint128.times(a, b) },
	{ name: "Uint128.toHex", fn: () => Uint128.toHex(a) },
	{ name: "Uint128.toBytes", fn: () => Uint128.toBytes(a) },
]);

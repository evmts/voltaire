import { runBenchSuite } from "../../bench-harness.js";
import * as Uint64 from "./index.js";

const a = Uint64.from(1_000_000_000_000n);
const b = Uint64.from(42_000_000n);
const bytes = new Uint8Array([0, 0, 0, 0xe8, 0xd4, 0xa5, 0x10, 0x00]);

await runBenchSuite("voltaire-ts:Uint64", [
	{ name: "Uint64.from(bigint)", fn: () => Uint64.from(1_000_000_000_000n) },
	{ name: "Uint64.fromHex", fn: () => Uint64.fromHex("0xe8d4a51000") },
	{ name: "Uint64.fromBytes", fn: () => Uint64.fromBytes(bytes) },
	{ name: "Uint64.plus", fn: () => Uint64.plus(a, b) },
	{ name: "Uint64.times", fn: () => Uint64.times(Uint64.from(1000n), b) },
	{ name: "Uint64.toHex", fn: () => Uint64.toHex(a) },
	{ name: "Uint64.toBytes", fn: () => Uint64.toBytes(a) },
]);

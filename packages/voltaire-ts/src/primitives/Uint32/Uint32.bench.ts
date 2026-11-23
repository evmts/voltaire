import { runBenchSuite } from "../../bench-harness.js";
import * as Uint32 from "./index.js";

const a = Uint32.from(123456789);
const b = Uint32.from(98765432);
const bytes = new Uint8Array([0x07, 0x5b, 0xcd, 0x15]);

await runBenchSuite("voltaire-ts:Uint32", [
	{ name: "Uint32.from(number)", fn: () => Uint32.from(123456789) },
	{ name: "Uint32.fromHex", fn: () => Uint32.fromHex("0x075bcd15") },
	{ name: "Uint32.fromBytes", fn: () => Uint32.fromBytes(bytes) },
	{ name: "Uint32.plus", fn: () => Uint32.plus(a, b) },
	{ name: "Uint32.minus", fn: () => Uint32.minus(a, b) },
	{ name: "Uint32.toHex", fn: () => Uint32.toHex(a) },
	{ name: "Uint32.toBytes", fn: () => Uint32.toBytes(a) },
]);

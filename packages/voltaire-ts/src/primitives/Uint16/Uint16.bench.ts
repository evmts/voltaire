import { runBenchSuite } from "../../bench-harness.js";
import * as Uint16 from "./index.js";

const a = Uint16.from(12345);
const b = Uint16.from(6789);
const bytes = new Uint8Array([0x30, 0x39]);

await runBenchSuite("voltaire-ts:Uint16", [
	{ name: "Uint16.from(number)", fn: () => Uint16.from(12345) },
	{ name: "Uint16.fromHex", fn: () => Uint16.fromHex("0x3039") },
	{ name: "Uint16.fromBytes", fn: () => Uint16.fromBytes(bytes) },
	{ name: "Uint16.plus", fn: () => Uint16.plus(a, b) },
	{ name: "Uint16.minus", fn: () => Uint16.minus(a, b) },
	{ name: "Uint16.toHex", fn: () => Uint16.toHex(a) },
	{ name: "Uint16.toBytes", fn: () => Uint16.toBytes(a) },
]);

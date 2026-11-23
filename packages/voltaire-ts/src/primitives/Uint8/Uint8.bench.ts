import { runBenchSuite } from "../../bench-harness.js";
import * as Uint8 from "./index.js";

const a = Uint8.from(120);
const b = Uint8.from(45);
const bytes = new Uint8Array([0x78]);

await runBenchSuite("voltaire-ts:Uint8", [
	{ name: "Uint8.from(number)", fn: () => Uint8.from(120) },
	{ name: "Uint8.fromHex", fn: () => Uint8.fromHex("0x78") },
	{ name: "Uint8.fromBytes", fn: () => Uint8.fromBytes(bytes) },
	{ name: "Uint8.plus", fn: () => Uint8.plus(a, b) },
	{ name: "Uint8.minus", fn: () => Uint8.minus(a, b) },
	{
		name: "Uint8.times",
		fn: () => Uint8.times(Uint8.from(12), Uint8.from(10)),
	},
	{ name: "Uint8.toHex", fn: () => Uint8.toHex(a) },
	{ name: "Uint8.toBytes", fn: () => Uint8.toBytes(a) },
]);

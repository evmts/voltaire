import { runBenchSuite } from "../../bench-harness.js";
import * as StorageValue from "./index.js";

const hex = `0x${"00".repeat(31)}2a`;
const val = StorageValue.fromHex(hex);

await runBenchSuite("voltaire-ts:StorageValue", [
	{ name: "StorageValue.fromHex", fn: () => StorageValue.fromHex(hex) },
	{ name: "StorageValue.toHex", fn: () => StorageValue.toHex(val) },
	{ name: "StorageValue.toUint256", fn: () => StorageValue.toUint256(val) },
]);

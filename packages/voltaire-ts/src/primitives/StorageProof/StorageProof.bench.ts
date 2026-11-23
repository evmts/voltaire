import { runBenchSuite } from "../../bench-harness.js";
import * as StorageProof from "./index.js";

const like = {
	key: { address: new Uint8Array(20), slot: 1n },
	value: new Uint8Array(32),
	proof: [new Uint8Array(32).fill(0xab)],
} as never;
const p = StorageProof.from(like);

await runBenchSuite("voltaire-ts:StorageProof", [
	{ name: "StorageProof.from", fn: () => StorageProof.from(like) },
	{ name: "StorageProof.equals", fn: () => StorageProof.equals(p, p) },
]);

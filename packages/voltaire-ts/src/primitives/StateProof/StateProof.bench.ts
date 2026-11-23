import { runBenchSuite } from "../../bench-harness.js";
import * as Address from "../Address/index.js";
import * as Hash from "../Hash/index.js";
import * as StateRoot from "../StateRoot/index.js";
import * as StateProof from "./index.js";

const like = {
	address: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"),
	accountProof: [new Uint8Array(32).fill(0xaa)],
	balance: 1000n,
	codeHash: Hash.fromHex(`0x${"11".repeat(32)}`),
	nonce: 1n,
	storageHash: StateRoot.fromHex(`0x${"22".repeat(32)}`),
	storageProof: [],
} as never;
const p = StateProof.from(like);

await runBenchSuite("voltaire-ts:StateProof", [
	{ name: "StateProof.from", fn: () => StateProof.from(like) },
	{ name: "StateProof.equals", fn: () => StateProof.equals(p, p) },
]);

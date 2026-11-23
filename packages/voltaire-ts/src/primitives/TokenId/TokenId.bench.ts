import { runBenchSuite } from "../../bench-harness.js";
import * as TokenId from "./index.js";

const id = TokenId.from(42n);

await runBenchSuite("voltaire-ts:TokenId", [
	{ name: "TokenId.from", fn: () => TokenId.from(42n) },
	{ name: "TokenId.toHex", fn: () => TokenId.toHex(id) },
	{ name: "TokenId.equals", fn: () => TokenId.equals(id, id) },
]);

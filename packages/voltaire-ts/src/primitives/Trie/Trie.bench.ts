import { runBenchSuite } from "../../bench-harness.js";
import { Trie } from "./index.js";

const keys = Array.from(
	{ length: 32 },
	(_, i) => new Uint8Array([i, i + 1, i + 2, i + 3]),
);
const vals = Array.from({ length: 32 }, (_, i) => new Uint8Array(32).fill(i));
let populated = Trie.init();
for (let i = 0; i < keys.length; i += 1) {
	populated = Trie.put(populated, keys[i]!, vals[i]!);
}

await runBenchSuite("voltaire-ts:Trie", [
	{
		name: "Trie.put (10 keys)",
		fn: () => {
			let t = Trie.init();
			for (let i = 0; i < 10; i += 1) t = Trie.put(t, keys[i]!, vals[i]!);
			return t;
		},
	},
	{ name: "Trie.get", fn: () => Trie.get(populated, keys[15]!) },
	{ name: "Trie.rootHash (32 keys)", fn: () => Trie.rootHash(populated) },
	{ name: "Trie.prove", fn: () => Trie.prove(populated, keys[15]!) },
	{ name: "Trie.keyToNibbles", fn: () => Trie.keyToNibbles(keys[0]!) },
]);

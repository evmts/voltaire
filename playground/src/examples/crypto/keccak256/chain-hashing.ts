import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Chain multiple hashes together
const message = "Hello, Ethereum!";

// Single hash
const hash1 = Keccak256.hashString(message);

// Double hash (hash of hash)
const hash2 = Keccak256.hash(hash1);

// Triple hash
const hash3 = Keccak256.hash(hash2);

// Build hash chain (like blockchain)
function buildHashChain(data: string[], length: number): Uint8Array[] {
	const chain: Uint8Array[] = [];
	let prevHash = Keccak256.hashString(data[0]);
	chain.push(prevHash);

	for (let i = 1; i < length && i < data.length; i++) {
		// Hash previous hash + new data
		const newData = new TextEncoder().encode(data[i]);
		const combined = new Uint8Array([...prevHash, ...newData]);
		prevHash = Keccak256.hash(combined);
		chain.push(prevHash);
	}

	return chain;
}

const blocks = ["genesis", "block1", "block2", "block3"];
const chain = buildHashChain(blocks, blocks.length);
chain.forEach((hash, i) => {});

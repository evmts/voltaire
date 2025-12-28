import { BlockHash } from "voltaire";
try {
	// With 0x prefix
	const hash1 = BlockHash.fromHex(
		"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	);
} catch (e) {}

try {
	// Without 0x prefix
	const hash2 = BlockHash.fromHex(
		"d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	);
} catch (e) {}

try {
	// From bytes (32 bytes)
	const bytes = new Uint8Array(32).fill(0xff);
	const hash3 = BlockHash.fromBytes(bytes);
} catch (e) {}

// Too short
try {
	const invalid = BlockHash.fromHex("0x1234");
} catch (e) {}

// Too long
try {
	const invalid = BlockHash.fromHex(
		"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3ff",
	);
} catch (e) {}

// Invalid characters
try {
	const invalid = BlockHash.fromHex(
		"0xGGe56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	);
} catch (e) {}

// Wrong byte length
try {
	const invalid = BlockHash.fromBytes(new Uint8Array(31));
} catch (e) {}

const knownHashes = {
	genesis: "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	merge: "0x56a9bb0302da44b8c0b3df540781424684c3af04d0b7a38d72842b762076a664",
};

function verifyBlockHash(name: string, hashStr: string): boolean {
	try {
		const hash = BlockHash.from(hashStr);
		const roundtrip = BlockHash.toHex(hash);
		const matches = roundtrip.toLowerCase() === hashStr.toLowerCase();
		return matches;
	} catch (e) {
		return false;
	}
}

verifyBlockHash("Genesis", knownHashes.genesis);
verifyBlockHash("Merge", knownHashes.merge);
const hash1 = BlockHash.from(knownHashes.genesis);
const hash2 = BlockHash.from(knownHashes.genesis.toUpperCase());
const hash3 = BlockHash.from(knownHashes.merge);

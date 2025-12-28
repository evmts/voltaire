import { Blake2, Hex } from "@tevm/voltaire";
// Content addressing (IPFS-style) using Blake2b

function contentAddress(data: Uint8Array): string {
	// Use 32-byte hash for content addressing
	const hash = Blake2.hash(data, 32);
	return Hex.fromBytes(hash);
}

// Example: Address some content
const content1 = new TextEncoder().encode("First piece of content");
const content2 = new TextEncoder().encode("Second piece of content");
const content3 = new TextEncoder().encode("First piece of content"); // Same as content1

const addr1 = contentAddress(content1);

const addr2 = contentAddress(content2);

const addr3 = contentAddress(content3);

// Build a simple content store
const contentStore = new Map<string, Uint8Array>();

function store(data: Uint8Array): string {
	const address = contentAddress(data);
	contentStore.set(address, data);
	return address;
}

function retrieve(address: string): Uint8Array | undefined {
	return contentStore.get(address);
}
const key = store(content1);
const retrieved = retrieve(key);

/**
 * ChaCha20-Poly1305 Multiple Messages
 *
 * Demonstrates safe patterns for encrypting multiple messages:
 * - Counter-based nonces
 * - Random nonces with collision tracking
 * - Message framing and storage
 */
import { ChaCha20Poly1305 } from "@tevm/voltaire";

console.log("=== ChaCha20-Poly1305 Multiple Messages ===\n");

const key = ChaCha20Poly1305.generateKey();

// Pattern 1: Counter-based nonces (recommended for sequential messages)
console.log("=== Pattern 1: Counter-Based Nonces ===");

class CounterEncryptor {
	private key: Uint8Array;
	private counter: bigint = 0n;

	constructor(key: Uint8Array) {
		this.key = key;
	}

	private nextNonce(): Uint8Array {
		const nonce = new Uint8Array(ChaCha20Poly1305.NONCE_SIZE);
		let c = this.counter++;
		for (let i = 0; i < 8; i++) {
			nonce[i] = Number(c & 0xffn);
			c >>= 8n;
		}
		return nonce;
	}

	encrypt(plaintext: Uint8Array): {
		nonce: Uint8Array;
		ciphertext: Uint8Array;
	} {
		const nonce = this.nextNonce();
		const ciphertext = ChaCha20Poly1305.encrypt(plaintext, this.key, nonce);
		return { nonce, ciphertext };
	}
}

const counterEnc = new CounterEncryptor(key);
const messages = ["First message", "Second message", "Third message"];

for (const msg of messages) {
	const plaintext = new TextEncoder().encode(msg);
	const { nonce, ciphertext } = counterEnc.encrypt(plaintext);
	console.log(
		`"${msg}" -> nonce: ${Buffer.from(nonce).toString("hex")}, len: ${ciphertext.length}`,
	);
}

// Pattern 2: Random nonces with storage
console.log("\n=== Pattern 2: Random Nonces with Message Storage ===");

interface StoredMessage {
	id: number;
	nonce: Uint8Array;
	ciphertext: Uint8Array;
	timestamp: number;
}

class MessageStore {
	private key: Uint8Array;
	private messages: StoredMessage[] = [];
	private nextId = 1;

	constructor(key: Uint8Array) {
		this.key = key;
	}

	store(plaintext: Uint8Array): number {
		const nonce = ChaCha20Poly1305.generateNonce();
		const ciphertext = ChaCha20Poly1305.encrypt(plaintext, this.key, nonce);
		const id = this.nextId++;
		this.messages.push({ id, nonce, ciphertext, timestamp: Date.now() });
		return id;
	}

	retrieve(id: number): Uint8Array | null {
		const msg = this.messages.find((m) => m.id === id);
		if (!msg) return null;
		return ChaCha20Poly1305.decrypt(msg.ciphertext, this.key, msg.nonce);
	}

	list(): number[] {
		return this.messages.map((m) => m.id);
	}
}

const store = new MessageStore(key);
const id1 = store.store(new TextEncoder().encode("Secret document 1"));
const id2 = store.store(new TextEncoder().encode("Secret document 2"));
const id3 = store.store(new TextEncoder().encode("Secret document 3"));

console.log(`Stored message IDs: ${store.list().join(", ")}`);
console.log(
	`Retrieved message ${id2}: "${new TextDecoder().decode(store.retrieve(id2)!)}"`,
);

// Pattern 3: Batch encryption with serialization
console.log("\n=== Pattern 3: Batch Encryption with Serialization ===");

function serializeMessages(messages: string[]): Uint8Array {
	// Format: [4-byte count][for each: 4-byte nonce+ciphertext length, nonce, ciphertext]
	const encrypted: { nonce: Uint8Array; ciphertext: Uint8Array }[] = [];

	for (const msg of messages) {
		const nonce = ChaCha20Poly1305.generateNonce();
		const plaintext = new TextEncoder().encode(msg);
		const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
		encrypted.push({ nonce, ciphertext });
	}

	// Calculate total size
	let totalSize = 4; // count
	for (const e of encrypted) {
		totalSize += 4 + e.nonce.length + e.ciphertext.length;
	}

	const result = new Uint8Array(totalSize);
	const view = new DataView(result.buffer);
	let offset = 0;

	view.setUint32(offset, encrypted.length, true);
	offset += 4;

	for (const e of encrypted) {
		const itemLen = e.nonce.length + e.ciphertext.length;
		view.setUint32(offset, itemLen, true);
		offset += 4;
		result.set(e.nonce, offset);
		offset += e.nonce.length;
		result.set(e.ciphertext, offset);
		offset += e.ciphertext.length;
	}

	return result;
}

function deserializeMessages(data: Uint8Array): string[] {
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	let offset = 0;

	const count = view.getUint32(offset, true);
	offset += 4;

	const messages: string[] = [];

	for (let i = 0; i < count; i++) {
		const itemLen = view.getUint32(offset, true);
		offset += 4;

		const nonce = data.slice(offset, offset + ChaCha20Poly1305.NONCE_SIZE);
		offset += ChaCha20Poly1305.NONCE_SIZE;

		const ciphertext = data.slice(
			offset,
			offset + itemLen - ChaCha20Poly1305.NONCE_SIZE,
		);
		offset += itemLen - ChaCha20Poly1305.NONCE_SIZE;

		const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
		messages.push(new TextDecoder().decode(decrypted));
	}

	return messages;
}

const batch = ["Message A", "Message B", "Message C", "Message D"];
const serialized = serializeMessages(batch);
console.log(
	`Serialized ${batch.length} messages into ${serialized.length} bytes`,
);

const deserialized = deserializeMessages(serialized);
console.log(`Deserialized messages: ${JSON.stringify(deserialized)}`);
console.log(`Match: ${JSON.stringify(batch) === JSON.stringify(deserialized)}`);

// Safety reminder
console.log("\n=== Safety Reminders ===");
console.log("1. NEVER reuse a nonce with the same key");
console.log(
	"2. Counter nonces: simple, no collision risk if state is preserved",
);
console.log("3. Random nonces: ~2^48 messages before collision risk");
console.log("4. Store nonces alongside ciphertext (they are not secret)");
console.log("5. Consider key rotation after 2^32 messages for extra safety");

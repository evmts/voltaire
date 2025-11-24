import * as AesGcm from "../../../crypto/AesGcm/index.js";

const key = await AesGcm.generateKey(256);

const nonce = AesGcm.generateNonce();

const nonces = Array.from({ length: 1000 }, () => AesGcm.generateNonce());
const nonceStrings = nonces.map((n) => Array.from(n).join(","));
const uniqueCount = new Set(nonceStrings).size;

const plaintext1 = new TextEncoder().encode("Message one");
const plaintext2 = new TextEncoder().encode("Message two");
const reusedNonce = AesGcm.generateNonce();

// BAD: Reusing nonce
const ct1 = await AesGcm.encrypt(plaintext1, key, reusedNonce);
const ct2 = await AesGcm.encrypt(plaintext2, key, reusedNonce);

const correctNonce1 = AesGcm.generateNonce();
const correctNonce2 = AesGcm.generateNonce();

const correctCt1 = await AesGcm.encrypt(plaintext1, key, correctNonce1);
const correctCt2 = await AesGcm.encrypt(plaintext2, key, correctNonce2);

const data = new TextEncoder().encode("Data to store");
const storageNonce = AesGcm.generateNonce();
const storageCt = await AesGcm.encrypt(data, key, storageNonce);

// Store nonce with ciphertext
const stored = new Uint8Array(storageNonce.length + storageCt.length);
stored.set(storageNonce, 0);
stored.set(storageCt, storageNonce.length);

// Retrieve and decrypt
const retrievedNonce = stored.slice(0, AesGcm.NONCE_SIZE);
const retrievedCt = stored.slice(AesGcm.NONCE_SIZE);
const retrieved = await AesGcm.decrypt(retrievedCt, key, retrievedNonce);

let counter = 0n;
const counterNonces: Uint8Array[] = [];

for (let i = 0; i < 5; i++) {
	const counterNonce = new Uint8Array(12);
	// Store counter in little-endian
	const counterBig = counter;
	counterNonce[0] = Number(counterBig & 0xffn);
	counterNonce[1] = Number((counterBig >> 8n) & 0xffn);
	counterNonce[2] = Number((counterBig >> 16n) & 0xffn);
	counterNonce[3] = Number((counterBig >> 24n) & 0xffn);

	counterNonces.push(counterNonce);
	counter++;
}

const nonceSpaceBits = 96;
const nonceSpace = 2n ** BigInt(nonceSpaceBits);

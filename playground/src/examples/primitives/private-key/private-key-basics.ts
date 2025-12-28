import { PrivateKey, PublicKey } from "voltaire";
import { Address } from "voltaire";

// Example: PrivateKey basics - NEVER log actual private keys in production

// WARNING: These are EXAMPLE keys only - never use in production
const exampleKey1 =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const exampleKey2 =
	"0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const pk1 = PrivateKey.from(exampleKey1);
const pk2 = PrivateKey.from(exampleKey2);

// Create from raw bytes
const exampleBytes = new Uint8Array(32);
crypto.getRandomValues(exampleBytes); // Secure random generation
const pk3 = PrivateKey.fromBytes(exampleBytes);
const pubKey1 = PrivateKey.toPublicKey(exampleKey1);
const pubHex = `0x${Array.from(pubKey1, (b) => b.toString(16).padStart(2, "0")).join("")}`;
const addr1 = PrivateKey.toAddress(exampleKey1);
const addr2 = PrivateKey.toAddress(exampleKey2);
const message = "Hello, Ethereum!";
const messageBytes = new TextEncoder().encode(message);

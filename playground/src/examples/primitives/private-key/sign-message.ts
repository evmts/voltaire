import { PrivateKey, Signature } from "voltaire";
import { Hash } from "voltaire";

// Helper to convert signature to hex
function sigToHex(sig: Uint8Array): string {
	return `0x${Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

// Example private key
const privateKey =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Message to sign
const message = "Hello, Ethereum!";
const messageBytes = new TextEncoder().encode(message);
const messageHash = Hash.keccak256(messageBytes);
const signature = PrivateKey.sign(privateKey, messageHash);
const sigHex = sigToHex(signature);
const msg1 = "Message 1";
const msg2 = "Message 2";

const hash1 = Hash.keccak256(new TextEncoder().encode(msg1));
const hash2 = Hash.keccak256(new TextEncoder().encode(msg2));

const sig1 = PrivateKey.sign(privateKey, hash1);
const sig2 = PrivateKey.sign(privateKey, hash2);
const ethMessage = `\x19Ethereum Signed Message:\n${message.length}${message}`;
const ethHash = Hash.keccak256(new TextEncoder().encode(ethMessage));
const ethSig = PrivateKey.sign(privateKey, ethHash);

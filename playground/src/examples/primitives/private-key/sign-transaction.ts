import { PrivateKey } from "voltaire";
import { Address, Hash } from "voltaire";

// Example: Signing transaction data with private key

// Helper to convert signature to hex
function sigToHex(sig: Uint8Array): string {
	return `0x${Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

// Example private key
const privateKey =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const fromAddr = PrivateKey.toAddress(privateKey);
const txData = {
	nonce: 0,
	gasPrice: "20000000000",
	gasLimit: "21000",
	to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	value: "1000000000000000000", // 1 ETH
	data: "0x",
	chainId: 1,
};
const txString = JSON.stringify(txData);
const txBytes = new TextEncoder().encode(txString);
const txHash = Hash.keccak256(txBytes);
const signature = PrivateKey.sign(privateKey, txHash);
const sigHex = sigToHex(signature);
const signedTx = {
	...txData,
	r: sigHex.slice(0, 66),
	s: `0x${sigHex.slice(66, 130)}`,
	v: `0x${sigHex.slice(130)}`,
};
for (let nonce = 0; nonce < 3; nonce++) {
	const tx = { ...txData, nonce };
	const hash = Hash.keccak256(new TextEncoder().encode(JSON.stringify(tx)));
	const sig = PrivateKey.sign(privateKey, hash);
}

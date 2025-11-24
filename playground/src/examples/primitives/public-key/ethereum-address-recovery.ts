import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import Address from "../../../primitives/Address/index.js";
import { Hash } from "../../../primitives/Hash/index.js";
import * as PrivateKey from "../../../primitives/PrivateKey/index.js";
import * as PublicKey from "../../../primitives/PublicKey/index.js";
const privateKey = PrivateKey.from(
	"0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
);
const senderAddress = Address(PrivateKey._toAddress.call(privateKey));

const transaction = {
	to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	value: "1000000000000000000", // 1 ETH in wei
	nonce: 0,
	gasLimit: 21000,
};
const txData = JSON.stringify(transaction);
const txHash = Hash.keccak256String(txData);
const signature = PrivateKey._sign(privateKey, txHash);
const recoveredPubKey = Secp256k1.recoverPublicKey(signature, txHash);
const recoveredAddress = Address(PublicKey._toAddress.call(recoveredPubKey));

// This is how Ethereum validates transactions
const isValidTransaction = senderAddress.equals(recoveredAddress);
const transactions = [
	{
		to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		value: "1000000000000000000",
	},
	{
		to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
		value: "2000000000000000000",
	},
	{
		to: "0x5aAed5936020b9Eb3cD4622dBBafA21dA757F30F",
		value: "3000000000000000000",
	},
];

for (let i = 0; i < transactions.length; i++) {
	const tx = transactions[i];
	const hash = Hash.keccak256String(JSON.stringify(tx));
	const sig = PrivateKey._sign(privateKey, hash);
	const recovered = Secp256k1.recoverPublicKey(sig, hash);
	const addr = Address(PublicKey._toAddress.call(recovered));
	const valid = senderAddress.equals(addr);
}

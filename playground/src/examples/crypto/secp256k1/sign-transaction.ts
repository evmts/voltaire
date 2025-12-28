import { Address, Hash, Hex, Secp256k1 } from "@tevm/voltaire";
// Sign Ethereum transaction

// Simulated transaction data
const txData = {
	nonce: "0x00",
	gasPrice: "0x09184e72a000",
	gasLimit: "0x5208",
	to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
	value: "0x0de0b6b3a7640000",
	data: "0x",
};

// Hash transaction data (simplified - real tx uses RLP encoding)
const txString = JSON.stringify(txData);
const txHash = Hash.keccak256String(txString);

// Sign transaction
const privateKey = Secp256k1.PrivateKey.random();
const signature = Secp256k1.sign(txHash, privateKey);

// Verify sender address can be recovered
const recoveredKey = Secp256k1.recoverPublicKey(signature, txHash);
const senderAddress = Address.fromPublicKey(recoveredKey);

import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Different EOA private keys
const key1 = new Uint8Array(32).fill(1);
const key2 = new Uint8Array(32).fill(2);
const key3 = new Uint8Array(32).fill(3);

// Delegate contracts
const smartWallet = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const gasManager = Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
const batchExecutor = Address.from("0x5aAeD5932B9EB3Cd462dDBAeFA21Da757F30FBD");

// Create multiple authorizations
const auth1 = Authorization.sign(
	{
		chainId: 1n,
		address: smartWallet,
		nonce: 0n,
	},
	key1,
);

const auth2 = Authorization.sign(
	{
		chainId: 1n,
		address: gasManager,
		nonce: 0n,
	},
	key2,
);

const auth3 = Authorization.sign(
	{
		chainId: 1n,
		address: batchExecutor,
		nonce: 0n,
	},
	key3,
);

const authList = [auth1, auth2, auth3];
authList.forEach((auth, i) => {
	const signer = Authorization.verify(auth);
});

// Calculate total gas cost
const emptyAccounts = 2; // Assume 2 accounts are empty
const totalGas = Authorization.calculateGasCost(authList, emptyAccounts);

// Process all authorizations
const processed = Authorization.processAll(authList);

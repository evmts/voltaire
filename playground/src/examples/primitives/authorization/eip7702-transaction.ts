import { Address, Authorization } from "voltaire";

// Account delegating execution (EOA)
const eoaPrivateKey = new Uint8Array(32);
eoaPrivateKey.fill(1);

// Contract to delegate to (e.g., smart wallet implementation)
const delegateContract = Address.from(
	"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
);

// Create authorization for the transaction
const authorization = Authorization.sign(
	{
		chainId: 1n,
		address: delegateContract,
		nonce: 0n, // Account's current nonce
	},
	eoaPrivateKey,
);

// Recover the authorizing account
const authorizingAccount = Authorization.verify(authorization);

// Calculate gas for the authorization
const gasCost = Authorization.getGasCost(authorization, true);

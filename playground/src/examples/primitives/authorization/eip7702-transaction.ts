import { Address, Authorization, Bytes, Bytes32 } from "@tevm/voltaire";

// Account delegating execution (EOA)
const eoaPrivateKey = Bytes32.zero();
eoaPrivateKey.fill(1);

// Contract to delegate to (e.g., smart wallet implementation)
const delegateContract = Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");

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

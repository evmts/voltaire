import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Example: EIP-7702 Transaction with Authorization List
// Shows how authorizations fit into a transaction

console.log("=== EIP-7702 Transaction Flow ===\n");

// Account delegating execution (EOA)
const eoaPrivateKey = new Uint8Array(32);
eoaPrivateKey.fill(1);

// Contract to delegate to (e.g., smart wallet implementation)
const delegateContract = Address.from(
	"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
);

console.log("Transaction Setup:");
console.log("Delegate Contract:", Address.toHex(delegateContract));
console.log();

// Create authorization for the transaction
const authorization = Authorization.sign(
	{
		chainId: 1n,
		address: delegateContract,
		nonce: 0n, // Account's current nonce
	},
	eoaPrivateKey,
);

console.log("Authorization Created:");
console.log(Authorization.format(authorization));
console.log();

// Recover the authorizing account
const authorizingAccount = Authorization.verify(authorization);

console.log("Authorization Details:");
console.log("Authorizing Account:", Address.toHex(authorizingAccount));
console.log("Delegate To:", Address.toHex(authorization.address));
console.log("On Chain:", authorization.chainId);
console.log();

// Calculate gas for the authorization
const gasCost = Authorization.getGasCost(authorization, true);
console.log("Gas Cost:");
console.log("Total:", gasCost, "gas");
console.log();

// Transaction would include:
// - Standard transaction fields (to, value, data, gas, etc.)
// - authorizationList: [authorization]
console.log("Transaction Authorization List:");
console.log("[ 1 authorization ]");
console.log("- Chain:", authorization.chainId);
console.log("- Nonce:", authorization.nonce);
console.log(
	"- Delegate:",
	Address.toHex(authorization.address).slice(0, 10) + "...",
);
console.log();

console.log("Effect:");
console.log("After this transaction, the EOA will temporarily");
console.log("execute code from the delegate contract address.");

import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Example: Account Abstraction with EIP-7702
// EOA temporarily becomes a smart contract account

console.log("=== Account Abstraction with EIP-7702 ===\n");

// Smart wallet contract (batching, gas sponsorship, etc.)
const smartWallet = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// EOA private key
const eoaKey = new Uint8Array(32);
eoaKey.fill(2);

console.log("Account Abstraction Setup:");
console.log("Smart Wallet Contract:", Address.toHex(smartWallet));
console.log();

// Create authorization to use smart wallet code
const auth = Authorization.sign(
	{
		chainId: 1n,
		address: smartWallet,
		nonce: 5n, // Current account nonce
	},
	eoaKey,
);

const eoaAddress = Authorization.verify(auth);

console.log("Temporary Transformation:");
console.log("EOA Address:", Address.toHex(eoaAddress));
console.log("Delegates to:", Address.toHex(smartWallet));
console.log("Account Nonce:", auth.nonce);
console.log();

// Benefits of this transformation
console.log("Capabilities Gained:");
console.log("- Batch multiple operations in one transaction");
console.log("- Custom validation logic");
console.log("- Gas sponsorship (meta-transactions)");
console.log("- Recovery mechanisms");
console.log("- Advanced signature schemes");
console.log();

// The authorization is temporary
console.log("Scope:");
console.log("Duration: Single transaction only");
console.log("Reversible: Yes, EOA reverts after transaction");
console.log("Gas Required:", Authorization.getGasCost(auth, false), "gas");
console.log();

// Comparison with traditional account abstraction
console.log("vs ERC-4337:");
console.log("+ No separate UserOperation mempool");
console.log("+ Native EOA compatibility");
console.log("+ Lower gas costs");
console.log("+ Direct integration with existing wallets");
console.log("- Requires EIP-7702 support");
console.log("- Temporary delegation only");

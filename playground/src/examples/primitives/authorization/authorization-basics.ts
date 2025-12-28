import { Address, Authorization } from "voltaire";

// Example: Authorization basics (EIP-7702)
// EIP-7702 allows EOAs to delegate code execution to a contract address

// Create a basic unsigned authorization
const unsigned = {
	chainId: 1n, // Mainnet
	address: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	nonce: 0n,
};

// Create a private key for signing (example only, never hardcode in production)
const privateKey = new Uint8Array(32);
privateKey.fill(1);

// Sign the authorization
const signed = Authorization.sign(unsigned, privateKey);

// Validate the authorization
try {
	Authorization.validate(signed);
} catch (error) {}

// Verify the signature
try {
	const recovered = Authorization.verify(signed);
} catch (error) {}

// Format for display
const formatted = Authorization.format(signed);

// Gas cost calculation
const gasCost = Authorization.getGasCost(signed, true); // true = empty account

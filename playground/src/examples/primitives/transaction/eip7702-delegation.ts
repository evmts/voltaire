// EIP-7702 Transaction: EOA delegation to smart contracts
import * as Transaction from "../../../primitives/Transaction/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Create EIP-7702 transaction with authorization list
const eip7702: Transaction.EIP7702 = {
	type: Transaction.Type.EIP7702,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 100_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 0n,
	data: new Uint8Array(),
	accessList: [],
	// Authorization list allows EOA to delegate execution to contract
	authorizationList: [
		{
			chainId: 1n,
			address: Address.from("0x1234567890123456789012345678901234567890"), // Contract to delegate to
			nonce: 0n, // EOA nonce at time of signing
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		},
	],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

console.log("Transaction type:", eip7702.type);
console.log("Chain ID:", eip7702.chainId);

// Get authorization count
const authCount = Transaction.getAuthorizationCount(eip7702);
console.log("Authorization count:", authCount);

// Get authorizations
const authorizations = Transaction.getAuthorizations(eip7702);
console.log("Authorizations:", authorizations.length);
console.log("First authorization chain ID:", authorizations[0].chainId);
console.log("Delegation nonce:", authorizations[0].nonce);

// Use cases:
// - Batched transactions from EOA
// - Sponsored transactions (gasless for user)
// - Social recovery
// - Multi-sig from EOA

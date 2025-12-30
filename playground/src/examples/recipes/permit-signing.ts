import {
	Address,
	Hex,
	Keccak256,
	Secp256k1,
	EIP712,
	Permit,
	Transaction,
} from "@tevm/voltaire";

// === ERC-2612 Permit Signing Recipe ===
// This recipe demonstrates gasless token approvals using ERC-2612 permits
// Allows users to approve token spending via signatures instead of transactions

console.log("=== ERC-2612 Permit Signing Recipe ===\n");

// === Step 1: Understanding ERC-2612 Permits ===
console.log("Step 1: Understanding ERC-2612 Permits");
console.log("-".repeat(50));

console.log(`
ERC-2612 extends ERC-20 with the permit() function:

Traditional approval flow:
  1. User sends approve(spender, amount) transaction
  2. User pays gas
  3. Spender can now transferFrom()

Permit flow:
  1. User signs a permit message (off-chain, free)
  2. Spender calls permit() with signature
  3. Spender can now transferFrom()

Benefits:
- Gasless approvals for users
- Combined approve+action in one tx
- Better UX (no separate approval tx)
- Meta-transactions support

Key EIP-712 structure:
  - Domain: {name, version, chainId, verifyingContract}
  - Permit: {owner, spender, value, nonce, deadline}
`);

// === Step 2: Set up accounts ===
console.log("\nStep 2: Set up Accounts");
console.log("-".repeat(50));

// Token owner (signer)
const ownerPrivateKey = Secp256k1.randomPrivateKey();
const ownerPublicKey = Secp256k1.derivePublicKey(ownerPrivateKey);
const ownerAddress = Address.fromPublicKey(ownerPublicKey);

// Spender (DEX router, lending protocol, etc.)
const spenderAddress = Address.fromHex(
	"0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Uniswap Router
);

console.log(`Owner: ${Address.toChecksummed(ownerAddress)}`);
console.log(`Spender: ${Address.toChecksummed(spenderAddress)}`);

// === Step 3: Define token domain ===
console.log("\n\nStep 3: Define Token Domain");
console.log("-".repeat(50));

// Example: USDC on Ethereum
const tokenAddress = Address.fromHex(
	"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
);

// Domain separator for USDC
// Note: Different tokens may use different domain parameters
const domain = {
	name: "USD Coin",
	version: "2", // USDC uses version "2"
	chainId: 1n,
	verifyingContract: Address.toHex(tokenAddress),
};

console.log("Token Domain (USDC):");
console.log(`  name: "${domain.name}"`);
console.log(`  version: "${domain.version}"`);
console.log(`  chainId: ${domain.chainId}`);
console.log(`  verifyingContract: ${domain.verifyingContract}`);

// === Step 4: Create permit message ===
console.log("\n\nStep 4: Create Permit Message");
console.log("-".repeat(50));

// Permit parameters
const value = 1_000_000_000n; // 1000 USDC (6 decimals)
const nonce = 0n; // First permit for this owner
const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

const permitMessage = {
	owner: Address.toHex(ownerAddress),
	spender: Address.toHex(spenderAddress),
	value,
	nonce,
	deadline,
};

console.log("Permit Message:");
console.log(`  owner: ${permitMessage.owner}`);
console.log(`  spender: ${permitMessage.spender}`);
console.log(`  value: ${permitMessage.value} (1000 USDC)`);
console.log(`  nonce: ${permitMessage.nonce}`);
console.log(`  deadline: ${permitMessage.deadline} (${new Date(Number(deadline) * 1000).toISOString()})`);

// === Step 5: Define permit types ===
console.log("\n\nStep 5: Define EIP-712 Types");
console.log("-".repeat(50));

// Standard ERC-2612 permit types
const permitTypes = {
	Permit: [
		{ name: "owner", type: "address" },
		{ name: "spender", type: "address" },
		{ name: "value", type: "uint256" },
		{ name: "nonce", type: "uint256" },
		{ name: "deadline", type: "uint256" },
	],
};

console.log("Permit Type:");
console.log("  Permit(address owner, address spender, uint256 value,");
console.log("         uint256 nonce, uint256 deadline)");

// === Step 6: Construct typed data ===
console.log("\n\nStep 6: Construct EIP-712 Typed Data");
console.log("-".repeat(50));

const typedData = {
	domain,
	types: permitTypes,
	primaryType: "Permit" as const,
	message: permitMessage,
};

console.log("Typed Data constructed:");
console.log(`  primaryType: "${typedData.primaryType}"`);
console.log(`  domain: (see above)`);
console.log(`  message: (see above)`);

// === Step 7: Sign the permit ===
console.log("\n\nStep 7: Sign the Permit");
console.log("-".repeat(50));

// Hash the typed data
const permitHash = EIP712.hashTypedData(typedData);
console.log(`Permit hash: ${Hex.fromBytes(permitHash)}`);

// Sign with EIP-712
const signature = EIP712.signTypedData(typedData, ownerPrivateKey);

// Extract r, s, v components
const r = signature.slice(0, 32);
const s = signature.slice(32, 64);
const v = signature[64];

console.log("\nSignature Components:");
console.log(`  r: ${Hex.fromBytes(r)}`);
console.log(`  s: ${Hex.fromBytes(s)}`);
console.log(`  v: ${v}`);
console.log(`\nFull signature: ${Hex.fromBytes(signature)}`);

// === Step 8: Verify the signature ===
console.log("\n\nStep 8: Verify the Signature");
console.log("-".repeat(50));

// Recover the signer
const recoveredAddress = EIP712.recoverAddress(signature, typedData);
console.log(`Expected owner: ${Address.toHex(ownerAddress)}`);
console.log(`Recovered signer: ${Hex.fromBytes(recoveredAddress)}`);

// Verify signature
const isValid = EIP712.verifyTypedData(signature, typedData, ownerAddress);
console.log(`Signature valid: ${isValid}`);

// === Step 9: Encode permit() call ===
console.log("\n\nStep 9: Encode permit() Function Call");
console.log("-".repeat(50));

// permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
const permitSelector = Keccak256.selector(
	"permit(address,address,uint256,uint256,uint8,bytes32,bytes32)",
);

// Encode calldata
const permitCalldata = new Uint8Array(4 + 32 * 7);
let offset = 0;

// Selector
permitCalldata.set(permitSelector, offset);
offset += 4;

// owner (address padded to 32 bytes)
permitCalldata.set(ownerAddress, offset + 12);
offset += 32;

// spender (address padded to 32 bytes)
permitCalldata.set(spenderAddress, offset + 12);
offset += 32;

// value (uint256)
const valueBytes = new Uint8Array(32);
let val = value;
for (let i = 31; i >= 0 && val > 0n; i--) {
	valueBytes[i] = Number(val & 0xffn);
	val >>= 8n;
}
permitCalldata.set(valueBytes, offset);
offset += 32;

// deadline (uint256)
const deadlineBytes = new Uint8Array(32);
let dl = deadline;
for (let i = 31; i >= 0 && dl > 0n; i--) {
	deadlineBytes[i] = Number(dl & 0xffn);
	dl >>= 8n;
}
permitCalldata.set(deadlineBytes, offset);
offset += 32;

// v (uint8, but padded to 32 bytes)
permitCalldata[offset + 31] = v;
offset += 32;

// r (bytes32)
permitCalldata.set(r, offset);
offset += 32;

// s (bytes32)
permitCalldata.set(s, offset);

console.log(`permit() calldata: ${Hex.fromBytes(permitCalldata)}`);
console.log(`Calldata length: ${permitCalldata.length} bytes`);

// === Step 10: Create transaction using the permit ===
console.log("\n\nStep 10: Create Transaction with Permit");
console.log("-".repeat(50));

// The spender would create a transaction calling permit() on the token
const permitTx: Transaction.EIP1559 = {
	type: 2,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 50_000_000_000n,
	gasLimit: 80_000n, // permit() is relatively cheap
	to: tokenAddress,
	value: 0n,
	data: permitCalldata,
	accessList: [],
};

console.log("Permit Transaction:");
console.log(`  to: ${Address.toChecksummed(tokenAddress)} (USDC)`);
console.log(`  data: permit(owner, spender, value, deadline, v, r, s)`);
console.log(`  gasLimit: ${permitTx.gasLimit}`);

// === Step 11: DAI-style permit (different structure) ===
console.log("\n\n=== DAI-Style Permit (Different Structure) ===");
console.log("-".repeat(50));

// DAI uses a slightly different permit structure
const daiAddress = Address.fromHex(
	"0x6B175474E89094C44Da98b954EescdecAD3F9e6Db",
);

const daiDomain = {
	name: "Dai Stablecoin",
	version: "1",
	chainId: 1n,
	verifyingContract: Address.toHex(daiAddress),
};

// DAI permit uses 'allowed' instead of 'value' and adds 'holder'
const daiPermitTypes = {
	Permit: [
		{ name: "holder", type: "address" },
		{ name: "spender", type: "address" },
		{ name: "nonce", type: "uint256" },
		{ name: "expiry", type: "uint256" },
		{ name: "allowed", type: "bool" },
	],
};

const daiPermitMessage = {
	holder: Address.toHex(ownerAddress),
	spender: Address.toHex(spenderAddress),
	nonce: 0n,
	expiry: deadline,
	allowed: true, // true = approve, false = revoke
};

console.log("DAI Permit (different structure):");
console.log(`  holder: ${daiPermitMessage.holder}`);
console.log(`  spender: ${daiPermitMessage.spender}`);
console.log(`  nonce: ${daiPermitMessage.nonce}`);
console.log(`  expiry: ${daiPermitMessage.expiry}`);
console.log(`  allowed: ${daiPermitMessage.allowed}`);

const daiTypedData = {
	domain: daiDomain,
	types: daiPermitTypes,
	primaryType: "Permit" as const,
	message: daiPermitMessage,
};

const daiSignature = EIP712.signTypedData(daiTypedData, ownerPrivateKey);
console.log(`\nDAI permit signature: ${Hex.fromBytes(daiSignature)}`);

// === Step 12: Permit2 (modern universal permit) ===
console.log("\n\n=== Permit2 (Universal Permit) ===");
console.log("-".repeat(50));

const permit2Address = Address.fromHex(
	"0x000000000022D473030F116dDEE9F6B43aC78BA3",
);

console.log(`Permit2: ${Address.toChecksummed(permit2Address)}`);

console.log(`
Permit2 is a universal permit contract:
- Works with ANY ERC-20 token
- Single approval to Permit2, then signature-based permissions
- More flexible: can permit specific amounts/spenders per signature

Permit2 flow:
1. User approves Permit2 once per token
2. For each DApp interaction:
   - User signs a Permit2 message
   - DApp calls permitTransferFrom() with signature
   - Tokens transfer in same transaction

Types of Permit2 signatures:
- PermitSingle: one token, one spender
- PermitBatch: multiple tokens, one spender
- PermitTransfer: direct transfer with permit
`);

// Permit2 PermitSingle structure
const permit2Types = {
	PermitSingle: [
		{ name: "details", type: "PermitDetails" },
		{ name: "spender", type: "address" },
		{ name: "sigDeadline", type: "uint256" },
	],
	PermitDetails: [
		{ name: "token", type: "address" },
		{ name: "amount", type: "uint160" },
		{ name: "expiration", type: "uint48" },
		{ name: "nonce", type: "uint48" },
	],
};

console.log("\nPermit2 PermitSingle Types:");
console.log("  PermitSingle {");
console.log("    details: PermitDetails,");
console.log("    spender: address,");
console.log("    sigDeadline: uint256");
console.log("  }");
console.log("  PermitDetails {");
console.log("    token: address,");
console.log("    amount: uint160,");
console.log("    expiration: uint48,");
console.log("    nonce: uint48");
console.log("  }");

// === Step 13: Common permit patterns ===
console.log("\n\n=== Common Permit Patterns ===");
console.log("-".repeat(50));

console.log(`
1. DEX Swap with Permit:
   User signs permit -> DEX calls permit() + swap() in one tx

2. NFT Purchase with Permit:
   User signs permit for payment token -> NFT contract uses permitTransferFrom

3. Lending Deposit with Permit:
   User signs permit -> Lending protocol deposits with single tx

4. Gas Station Network:
   User signs permit -> Relayer pays gas + executes action

5. Batch Operations:
   User signs PermitBatch -> Multiple token operations in one signature
`);

// === Step 14: Security considerations ===
console.log("\n=== Security Considerations ===");
console.log("-".repeat(50));

console.log(`
1. Always check deadline:
   - Set reasonable expiration (1 hour, 24 hours)
   - Never use max uint256 deadline

2. Verify domain separator:
   - Matches the token contract
   - Correct chainId for current network

3. Nonce management:
   - Query current nonce from contract
   - Don't reuse nonces

4. Signature replay:
   - Check chainId in domain
   - EIP-155 protection

5. Value/amount limits:
   - Only permit what you need
   - Avoid infinite approvals

6. Revocation:
   - Traditional approve(0) to revoke
   - For Permit2: update allowance with new permit
`);

// === Step 15: Helper function ===
console.log("\n=== Reusable Helper Function ===");
console.log("-".repeat(50));

/**
 * Creates a permit signature for ERC-2612 tokens
 * @param params - Permit parameters
 * @returns Signature components (v, r, s)
 */
function createPermitSignature(params: {
	tokenName: string;
	tokenVersion: string;
	tokenAddress: Uint8Array;
	chainId: bigint;
	owner: Uint8Array;
	spender: Uint8Array;
	value: bigint;
	nonce: bigint;
	deadline: bigint;
	privateKey: Uint8Array;
}): { v: number; r: Uint8Array; s: Uint8Array } {
	const typedData = {
		domain: {
			name: params.tokenName,
			version: params.tokenVersion,
			chainId: params.chainId,
			verifyingContract: Address.toHex(params.tokenAddress),
		},
		types: {
			Permit: [
				{ name: "owner", type: "address" },
				{ name: "spender", type: "address" },
				{ name: "value", type: "uint256" },
				{ name: "nonce", type: "uint256" },
				{ name: "deadline", type: "uint256" },
			],
		},
		primaryType: "Permit" as const,
		message: {
			owner: Address.toHex(params.owner),
			spender: Address.toHex(params.spender),
			value: params.value,
			nonce: params.nonce,
			deadline: params.deadline,
		},
	};

	const sig = EIP712.signTypedData(typedData, params.privateKey);

	return {
		v: sig[64],
		r: sig.slice(0, 32),
		s: sig.slice(32, 64),
	};
}

// Example usage
const exampleSig = createPermitSignature({
	tokenName: "USD Coin",
	tokenVersion: "2",
	tokenAddress: tokenAddress,
	chainId: 1n,
	owner: ownerAddress,
	spender: spenderAddress,
	value: 1_000_000n,
	nonce: 0n,
	deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
	privateKey: ownerPrivateKey,
});

console.log("Helper function output:");
console.log(`  v: ${exampleSig.v}`);
console.log(`  r: ${Hex.fromBytes(exampleSig.r)}`);
console.log(`  s: ${Hex.fromBytes(exampleSig.s)}`);

console.log("\n=== Recipe Complete ===");
console.log("\nKey points:");
console.log("1. ERC-2612 permits enable gasless approvals");
console.log("2. Different tokens may have different domain parameters");
console.log("3. DAI uses a slightly different permit structure");
console.log("4. Permit2 provides universal permit functionality");
console.log("5. Always set reasonable deadlines and verify domains");

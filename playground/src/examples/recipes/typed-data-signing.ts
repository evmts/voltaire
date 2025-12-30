import { Address, EIP712, Hex, Keccak256, Secp256k1 } from "@tevm/voltaire";

// === EIP-712 Typed Data Signing Recipe ===
// This recipe demonstrates how to sign structured typed data
// following the EIP-712 standard for secure, readable signatures

console.log("=== EIP-712 Typed Data Signing Recipe ===\n");

// === Step 1: Set up signing key ===
console.log("Step 1: Generate or import a signing key");
console.log("-".repeat(50));

const privateKey = Secp256k1.randomPrivateKey();
const publicKey = Secp256k1.derivePublicKey(privateKey);
const signerAddress = Address.fromPublicKey(publicKey);

console.log(`Signer Address: ${Address.toChecksummed(signerAddress)}`);
console.log(`Private Key: ${Hex.fromBytes(privateKey)}`);

// === Step 2: Define the domain separator ===
console.log("\n\nStep 2: Define the EIP-712 domain separator");
console.log("-".repeat(50));

// The domain separator uniquely identifies your application
// to prevent cross-app signature replay attacks
const domain = {
	name: "My DApp",
	version: "1",
	chainId: 1n, // Ethereum Mainnet
	verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
};

console.log("Domain:");
console.log(`  name: "${domain.name}"`);
console.log(`  version: "${domain.version}"`);
console.log(`  chainId: ${domain.chainId}`);
console.log(`  verifyingContract: ${domain.verifyingContract}`);

// === Step 3: Define custom types ===
console.log("\n\nStep 3: Define custom types");
console.log("-".repeat(50));

// EIP-712 allows defining custom struct types
// Types reference each other, enabling complex nested structures
const types = {
	Person: [
		{ name: "name", type: "string" },
		{ name: "wallet", type: "address" },
	],
	Mail: [
		{ name: "from", type: "Person" },
		{ name: "to", type: "Person" },
		{ name: "contents", type: "string" },
	],
};

console.log("Custom Types:");
console.log("  Person:");
console.log("    - name: string");
console.log("    - wallet: address");
console.log("  Mail:");
console.log("    - from: Person");
console.log("    - to: Person");
console.log("    - contents: string");

// === Step 4: Create the message ===
console.log("\n\nStep 4: Create the typed message");
console.log("-".repeat(50));

const message = {
	from: {
		name: "Alice",
		wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
	},
	to: {
		name: "Bob",
		wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
	},
	contents: "Hello, Bob!",
};

console.log("Message:");
console.log(`  from.name: "${message.from.name}"`);
console.log(`  from.wallet: ${message.from.wallet}`);
console.log(`  to.name: "${message.to.name}"`);
console.log(`  to.wallet: ${message.to.wallet}`);
console.log(`  contents: "${message.contents}"`);

// === Step 5: Construct the full typed data object ===
console.log("\n\nStep 5: Construct the full typed data object");
console.log("-".repeat(50));

const typedData = {
	domain,
	types,
	primaryType: "Mail" as const,
	message,
};

console.log("Typed Data Object:");
console.log(`  primaryType: "${typedData.primaryType}"`);
console.log("  domain: (see above)");
console.log("  types: (see above)");
console.log("  message: (see above)");

// === Step 6: Hash the typed data ===
console.log("\n\nStep 6: Hash the typed data");
console.log("-".repeat(50));

// EIP-712 hashing follows a specific encoding scheme
const typedDataHash = EIP712.hashTypedData(typedData);

console.log(`Typed data hash: ${Hex.fromBytes(typedDataHash)}`);

// === Step 7: Sign the typed data ===
console.log("\n\nStep 7: Sign the typed data");
console.log("-".repeat(50));

// Sign using the EIP-712 signTypedData function
const signature = EIP712.signTypedData(typedData, privateKey);

console.log(`Signature r: ${Hex.fromBytes(signature.slice(0, 32))}`);
console.log(`Signature s: ${Hex.fromBytes(signature.slice(32, 64))}`);
console.log(`Signature v: ${signature[64]}`);
console.log(`\nFull signature: ${Hex.fromBytes(signature)}`);

// === Step 8: Verify the signature ===
console.log("\n\nStep 8: Verify the signature");
console.log("-".repeat(50));

// Recover the signer address from the signature
const recoveredAddress = EIP712.recoverAddress(signature, typedData);

console.log(`Expected address: ${Address.toChecksummed(signerAddress)}`);
console.log(`Recovered address: ${Hex.fromBytes(recoveredAddress)}`);

// Verify using the verifyTypedData function
const isValid = EIP712.verifyTypedData(signature, typedData, signerAddress);
console.log(`Signature valid: ${isValid}`);

// === Step 9: More complex example - Permit (ERC-2612) ===
console.log("\n\n=== Complex Example: ERC-2612 Permit ===");
console.log("-".repeat(50));

// Permit allows gasless token approvals via signatures
const permitDomain = {
	name: "USD Coin",
	version: "2",
	chainId: 1n,
	verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
};

const permitTypes = {
	Permit: [
		{ name: "owner", type: "address" },
		{ name: "spender", type: "address" },
		{ name: "value", type: "uint256" },
		{ name: "nonce", type: "uint256" },
		{ name: "deadline", type: "uint256" },
	],
};

const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

const permitMessage = {
	owner: Address.toChecksummed(signerAddress),
	spender: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Uniswap Router
	value: 1000000n, // 1 USDC (6 decimals)
	nonce: 0n,
	deadline,
};

console.log("Permit Domain (USDC):");
console.log(`  name: "${permitDomain.name}"`);
console.log(`  version: "${permitDomain.version}"`);
console.log(`  verifyingContract: ${permitDomain.verifyingContract}`);

console.log("\nPermit Message:");
console.log(`  owner: ${permitMessage.owner}`);
console.log(`  spender: ${permitMessage.spender}`);
console.log(`  value: ${permitMessage.value} (1 USDC)`);
console.log(`  nonce: ${permitMessage.nonce}`);
console.log(`  deadline: ${permitMessage.deadline}`);

const permitTypedData = {
	domain: permitDomain,
	types: permitTypes,
	primaryType: "Permit" as const,
	message: permitMessage,
};

const permitSignature = EIP712.signTypedData(permitTypedData, privateKey);
console.log(`\nPermit signature: ${Hex.fromBytes(permitSignature)}`);

// Extract r, s, v for contract calls
const r = permitSignature.slice(0, 32);
const s = permitSignature.slice(32, 64);
const v = permitSignature[64];

console.log("\nSignature components for contract call:");
console.log(`  r: ${Hex.fromBytes(r)}`);
console.log(`  s: ${Hex.fromBytes(s)}`);
console.log(`  v: ${v}`);

// === Step 10: Order signing (DEX example) ===
console.log("\n\n=== DEX Order Signing Example ===");
console.log("-".repeat(50));

const orderDomain = {
	name: "MyDEX",
	version: "1",
	chainId: 1n,
	verifyingContract: "0x1234567890123456789012345678901234567890",
};

const orderTypes = {
	Order: [
		{ name: "maker", type: "address" },
		{ name: "makerToken", type: "address" },
		{ name: "takerToken", type: "address" },
		{ name: "makerAmount", type: "uint256" },
		{ name: "takerAmount", type: "uint256" },
		{ name: "expiry", type: "uint256" },
		{ name: "salt", type: "uint256" },
	],
};

const orderMessage = {
	maker: Address.toChecksummed(signerAddress),
	makerToken: "0x6B175474E89094C44Da98b954EescdecAD3F9e6Db", // DAI
	takerToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
	makerAmount: BigInt("1000000000000000000"), // 1 DAI (18 decimals)
	takerAmount: BigInt("1000000"), // 1 USDC (6 decimals)
	expiry: BigInt(Math.floor(Date.now() / 1000) + 86400), // 24 hours
	salt: BigInt(Math.floor(Math.random() * 1e18)),
};

console.log("DEX Order:");
console.log(`  Sell: 1 DAI`);
console.log(`  For: 1 USDC`);
console.log(`  Expiry: 24 hours`);

const orderTypedData = {
	domain: orderDomain,
	types: orderTypes,
	primaryType: "Order" as const,
	message: orderMessage,
};

const orderSignature = EIP712.signTypedData(orderTypedData, privateKey);
console.log(`Order signature: ${Hex.fromBytes(orderSignature)}`);

// === Step 11: Validate typed data ===
console.log("\n\n=== Validation ===");
console.log("-".repeat(50));

// EIP712.validate throws if the typed data is malformed
try {
	EIP712.validate(typedData);
	console.log("Typed data validation: PASSED");
} catch (e) {
	console.log(`Typed data validation: FAILED - ${e}`);
}

// === Step 12: Format for display ===
console.log("\n\n=== Human-Readable Format ===");
console.log("-".repeat(50));

const formatted = EIP712.format(typedData);
console.log("Formatted typed data for wallet display:");
console.log(formatted);

console.log("\n=== Recipe Complete ===");

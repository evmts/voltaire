import { Address, EIP712, Hex, Keccak256, Secp256k1 } from "@tevm/voltaire";

const privateKey = Secp256k1.randomPrivateKey();
const publicKey = Secp256k1.derivePublicKey(privateKey);
const signerAddress = Address.fromPublicKey(publicKey);

// The domain separator uniquely identifies your application
// to prevent cross-app signature replay attacks
const domain = {
	name: "My DApp",
	version: "1",
	chainId: 1n, // Ethereum Mainnet
	verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
};

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

const typedData = {
	domain,
	types,
	primaryType: "Mail" as const,
	message,
};

// EIP-712 hashing follows a specific encoding scheme
const typedDataHash = EIP712.hashTypedData(typedData);

// Sign using the EIP-712 signTypedData function
const signature = EIP712.signTypedData(typedData, privateKey);

// Recover the signer address from the signature
const recoveredAddress = EIP712.recoverAddress(signature, typedData);

// Verify using the verifyTypedData function
const isValid = EIP712.verifyTypedData(signature, typedData, signerAddress);

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

const permitTypedData = {
	domain: permitDomain,
	types: permitTypes,
	primaryType: "Permit" as const,
	message: permitMessage,
};

const permitSignature = EIP712.signTypedData(permitTypedData, privateKey);

// Extract r, s, v for contract calls
const r = permitSignature.slice(0, 32);
const s = permitSignature.slice(32, 64);
const v = permitSignature[64];

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

const orderTypedData = {
	domain: orderDomain,
	types: orderTypes,
	primaryType: "Order" as const,
	message: orderMessage,
};

const orderSignature = EIP712.signTypedData(orderTypedData, privateKey);

// EIP712.validate throws if the typed data is malformed
try {
	EIP712.validate(typedData);
} catch (e) {}

const formatted = EIP712.format(typedData);

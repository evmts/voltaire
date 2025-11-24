import * as Siwe from "../../../primitives/Siwe/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Example: SIWE statement field usage patterns

console.log("\n=== Basic Statements ===\n");

const address = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Simple authentication
const simpleAuth = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com/login",
	chainId: 1,
	statement: "Sign in to Example",
});

console.log("Simple auth:", simpleAuth.statement);

// Welcome message
const welcome = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	statement:
		"Welcome! Sign this message to authenticate with your Ethereum account.",
});

console.log("Welcome:", welcome.statement);

// Professional
const professional = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com/auth",
	chainId: 1,
	statement: "By signing this message, you authorize access to your account.",
});

console.log("Professional:", professional.statement);

console.log("\n=== Permission Statements ===\n");

// Read access
const readAccess = Siwe.create({
	domain: "api.example.com",
	address: address,
	uri: "https://api.example.com",
	chainId: 1,
	statement: "Grant read access to your profile and transaction history",
});

console.log("Read access:", readAccess.statement);

// Write access
const writeAccess = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com",
	chainId: 1,
	statement: "Authorize changes to your account settings and preferences",
});

console.log("Write access:", writeAccess.statement);

// Admin access
const adminAccess = Siwe.create({
	domain: "admin.example.com",
	address: address,
	uri: "https://admin.example.com",
	chainId: 1,
	statement: "Sign to verify administrator privileges for this session",
});

console.log("Admin access:", adminAccess.statement);

console.log("\n=== Action-Specific Statements ===\n");

// Token transfer
const transfer = Siwe.create({
	domain: "wallet.example.com",
	address: address,
	uri: "https://wallet.example.com/transfer",
	chainId: 1,
	statement: "Confirm token transfer of 100 USDC to 0xABC...",
});

console.log("Transfer:", transfer.statement);

// NFT minting
const mint = Siwe.create({
	domain: "nft.example.com",
	address: address,
	uri: "https://nft.example.com/mint",
	chainId: 1,
	statement: "Sign to mint your unique NFT from the Collection",
});

console.log("Mint:", mint.statement);

// Voting
const vote = Siwe.create({
	domain: "governance.example.com",
	address: address,
	uri: "https://governance.example.com/vote",
	chainId: 1,
	statement: "Cast your vote on Proposal #42: Upgrade Protocol",
});

console.log("Vote:", vote.statement);

console.log("\n=== Multi-Line Statements ===\n");

// Terms and conditions
const terms = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com",
	chainId: 1,
	statement:
		"By signing this message, you agree to:\n- Terms of Service\n- Privacy Policy\n- Community Guidelines",
});

console.log("Terms:");
console.log(terms.statement);

// Detailed permissions
const detailed = Siwe.create({
	domain: "dapp.example.com",
	address: address,
	uri: "https://dapp.example.com",
	chainId: 1,
	statement:
		"This signature grants:\n\n1. Access to your profile data\n2. Permission to read your transaction history\n3. Ability to sign transactions on your behalf",
});

console.log("\nDetailed permissions:");
console.log(detailed.statement);

console.log("\n=== User-Friendly Statements ===\n");

// Clear and concise
const clear = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	statement: "Sign in securely without passwords",
});

console.log("Clear:", clear.statement);

// Benefit-focused
const benefit = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	statement: "Connect your wallet to unlock exclusive features",
});

console.log("Benefit:", benefit.statement);

// Trust-building
const trust = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	statement:
		"We will never access your funds. This signature only proves ownership.",
});

console.log("Trust:", trust.statement);

console.log("\n=== Context-Aware Statements ===\n");

// Time-sensitive
const timeSensitive = Siwe.create({
	domain: "flash.example.com",
	address: address,
	uri: "https://flash.example.com",
	chainId: 1,
	statement: "Sign in to participate in the 24-hour sale (expires soon)",
	expirationTime: new Date(Date.now() + 86400000).toISOString(),
});

console.log("Time-sensitive:", timeSensitive.statement);

// Location-aware
const location = Siwe.create({
	domain: "event.example.com",
	address: address,
	uri: "https://event.example.com/checkin",
	chainId: 1,
	statement: "Check in to Ethereum Conference 2024 - Denver",
});

console.log("Location:", location.statement);

// Session-based
const session = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com",
	chainId: 1,
	statement: "Create new session (Session ID: abc123)",
	requestId: "session-abc123",
});

console.log("Session:", session.statement);

console.log("\n=== Warning Statements ===\n");

// Security warning
const security = Siwe.create({
	domain: "high-value.example.com",
	address: address,
	uri: "https://high-value.example.com",
	chainId: 1,
	statement:
		"WARNING: This action will transfer assets. Verify all details before signing.",
});

console.log("Security:", security.statement);

// Irreversible action
const irreversible = Siwe.create({
	domain: "burn.example.com",
	address: address,
	uri: "https://burn.example.com",
	chainId: 1,
	statement:
		"CAUTION: This action is irreversible. You are about to burn 1 NFT.",
});

console.log("Irreversible:", irreversible.statement);

console.log("\n=== No Statement ===\n");

// Message without statement
const noStatement = Siwe.create({
	domain: "minimal.example.com",
	address: address,
	uri: "https://minimal.example.com",
	chainId: 1,
});

console.log("Has statement:", noStatement.statement !== undefined);
console.log("Statement value:", noStatement.statement ?? "(none)");

console.log("\n=== Formatted Output ===\n");

// Show how statements appear in formatted messages
const examples = [simpleAuth, terms, security];

examples.forEach((msg, i) => {
	console.log(`\nExample ${i + 1}:`);
	const formatted = Siwe.format(msg);
	const lines = formatted.split("\n");
	// Show first 5 lines which include domain, address, and statement
	console.log(lines.slice(0, 5).join("\n"));
	console.log("...");
});

console.log("\n=== Statement Best Practices ===\n");

console.log("Good practices:");
console.log("- Keep statements concise and clear");
console.log("- Explain what access is being granted");
console.log("- Use plain language, avoid jargon");
console.log("- Include warnings for sensitive actions");
console.log("- Be specific about permissions");
console.log("- Build trust with transparency");

console.log("\nBad practices:");
console.log("- Vague statements like 'Sign to continue'");
console.log("- Hidden permissions in legal text");
console.log("- Misleading action descriptions");
console.log("- Overly technical language");
console.log("- Missing context for the signature");

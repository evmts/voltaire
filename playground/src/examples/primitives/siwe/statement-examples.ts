import { Address, Siwe } from "@tevm/voltaire";
const address = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Simple authentication
const simpleAuth = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com/login",
	chainId: 1,
	statement: "Sign in to Example",
});

// Welcome message
const welcome = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	statement:
		"Welcome! Sign this message to authenticate with your Ethereum account.",
});

// Professional
const professional = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com/auth",
	chainId: 1,
	statement: "By signing this message, you authorize access to your account.",
});

// Read access
const readAccess = Siwe.create({
	domain: "api.example.com",
	address: address,
	uri: "https://api.example.com",
	chainId: 1,
	statement: "Grant read access to your profile and transaction history",
});

// Write access
const writeAccess = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com",
	chainId: 1,
	statement: "Authorize changes to your account settings and preferences",
});

// Admin access
const adminAccess = Siwe.create({
	domain: "admin.example.com",
	address: address,
	uri: "https://admin.example.com",
	chainId: 1,
	statement: "Sign to verify administrator privileges for this session",
});

// Token transfer
const transfer = Siwe.create({
	domain: "wallet.example.com",
	address: address,
	uri: "https://wallet.example.com/transfer",
	chainId: 1,
	statement: "Confirm token transfer of 100 USDC to 0xABC...",
});

// NFT minting
const mint = Siwe.create({
	domain: "nft.example.com",
	address: address,
	uri: "https://nft.example.com/mint",
	chainId: 1,
	statement: "Sign to mint your unique NFT from the Collection",
});

// Voting
const vote = Siwe.create({
	domain: "governance.example.com",
	address: address,
	uri: "https://governance.example.com/vote",
	chainId: 1,
	statement: "Cast your vote on Proposal #42: Upgrade Protocol",
});

// Terms and conditions
const terms = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com",
	chainId: 1,
	statement:
		"By signing this message, you agree to:\n- Terms of Service\n- Privacy Policy\n- Community Guidelines",
});

// Detailed permissions
const detailed = Siwe.create({
	domain: "dapp.example.com",
	address: address,
	uri: "https://dapp.example.com",
	chainId: 1,
	statement:
		"This signature grants:\n\n1. Access to your profile data\n2. Permission to read your transaction history\n3. Ability to sign transactions on your behalf",
});

// Clear and concise
const clear = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	statement: "Sign in securely without passwords",
});

// Benefit-focused
const benefit = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	statement: "Connect your wallet to unlock exclusive features",
});

// Trust-building
const trust = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	statement:
		"We will never access your funds. This signature only proves ownership.",
});

// Time-sensitive
const timeSensitive = Siwe.create({
	domain: "flash.example.com",
	address: address,
	uri: "https://flash.example.com",
	chainId: 1,
	statement: "Sign in to participate in the 24-hour sale (expires soon)",
	expirationTime: new Date(Date.now() + 86400000).toISOString(),
});

// Location-aware
const location = Siwe.create({
	domain: "event.example.com",
	address: address,
	uri: "https://event.example.com/checkin",
	chainId: 1,
	statement: "Check in to Ethereum Conference 2024 - Denver",
});

// Session-based
const session = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com",
	chainId: 1,
	statement: "Create new session (Session ID: abc123)",
	requestId: "session-abc123",
});

// Security warning
const security = Siwe.create({
	domain: "high-value.example.com",
	address: address,
	uri: "https://high-value.example.com",
	chainId: 1,
	statement:
		"WARNING: This action will transfer assets. Verify all details before signing.",
});

// Irreversible action
const irreversible = Siwe.create({
	domain: "burn.example.com",
	address: address,
	uri: "https://burn.example.com",
	chainId: 1,
	statement:
		"CAUTION: This action is irreversible. You are about to burn 1 NFT.",
});

// Message without statement
const noStatement = Siwe.create({
	domain: "minimal.example.com",
	address: address,
	uri: "https://minimal.example.com",
	chainId: 1,
});

// Show how statements appear in formatted messages
const examples = [simpleAuth, terms, security];

examples.forEach((msg, i) => {
	const formatted = Siwe.format(msg);
	const lines = formatted.split("\n");
});

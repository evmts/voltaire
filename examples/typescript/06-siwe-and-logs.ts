/**
 * Example 6: SIWE Messages and Event Logs
 *
 * Demonstrates:
 * - Creating and parsing SIWE messages
 * - Validating SIWE messages
 * - Working with event logs
 * - Filtering logs
 */

import { EventLog, Siwe } from "@tevm/voltaire";

// Parse a SIWE message
const siweMessage = `example.com wants you to sign in with your Ethereum account:
0x1234567890123456789012345678901234567890

I accept the Terms of Service: https://example.com/tos

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: 32891757
Issued At: 2024-01-01T00:00:00.000Z
Expiration Time: 2024-01-02T00:00:00.000Z
Request ID: some-request-id
Resources:
- https://example.com/resource1
- https://example.com/resource2`;

const parsed = Siwe.parse(siweMessage);

// Validate SIWE message
const validMsg = Siwe.validate(parsed);

// Create a SIWE message
const siweObj = Siwe.create({
	domain: "app.example.com",
	address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
	statement: "Sign in to the application",
	uri: "https://app.example.com",
	version: "1",
	chainId: 1,
	nonce: "random-nonce-12345",
	issuedAt: new Date().toISOString(),
	expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

// Format SIWE message to string
const formatted = Siwe.format(siweObj);

// Generate a random nonce
const nonce = Siwe.generateNonce();

// Create minimal SIWE message
const minimalSiwe = Siwe.create({
	domain: "minimal.example.com",
	address: "0x1111111111111111111111111111111111111111",
	uri: "https://minimal.example.com",
	version: "1",
	chainId: 1,
	nonce: "nonce123",
	issuedAt: new Date().toISOString(),
});

const minimalFormatted = Siwe.format(minimalSiwe);

// Example event log (Transfer event)
const transferLog = EventLog.create({
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
	topics: [
		"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer(address,address,uint256)
		"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0", // from
		"0x000000000000000000000000e92a8b5a75c16874ae6a25c44a8e7e2e3c2c4e5c", // to
	],
	data: "0x0000000000000000000000000000000000000000000000000000000005f5e100", // 100000000 (100 USDC with 6 decimals)
	blockNumber: 19000000n,
	transactionHash:
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	transactionIndex: 50,
	blockHash:
		"0x5678567856785678567856785678567856785678567856785678567856785678",
	logIndex: 25,
});

// Get topic0 (event signature hash)
const topic0 = EventLog.getTopic0(transferLog);

// Get indexed topics
const indexedTopics = EventLog.getIndexedTopics(transferLog);

// Create multiple logs for filtering
const approvalLog = EventLog.create({
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	topics: [
		"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925", // Approval(address,address,uint256)
		"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0", // owner
		"0x0000000000000000000000001111111254eeb25477b68fb85ed929f73a960582", // spender
	],
	data: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // unlimited approval
});

const logs = [transferLog, approvalLog];

// Sort logs by block number and log index
const sortedLogs = EventLog.sortLogs(logs);

// Filter logs (example - would need proper filter structure)
// const filtered = EventLog.filterLogs(logs, someFilter);

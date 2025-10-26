/**
 * Example 6: SIWE Messages and Event Logs
 *
 * Demonstrates:
 * - Creating and parsing SIWE messages
 * - Validating SIWE messages
 * - Parsing event logs
 * - Filtering logs by topics
 */

import {
	type SiweMessage,
	formatMessage,
	isExpired,
	isNotYetValid,
	parseMessage,
	validateMessage,
} from "../../src/typescript/primitives/siwe";

import {
	type EventLog,
	type EventSignature,
	createEventSignatureHash,
	filterLogsByTopics,
	parseEventLog,
} from "../../src/typescript/primitives/logs";
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

const parsed = parseMessage(siweMessage);
const validMsg = validateMessage(parsed);

const expired = isExpired(parsed, new Date("2024-01-03").getTime());

const notYetValid = isNotYetValid(parsed, new Date("2023-12-31").getTime());
const siweObj: SiweMessage = {
	domain: "app.example.com",
	address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
	statement: "Sign in to the application",
	uri: "https://app.example.com",
	version: "1",
	chainId: 1,
	nonce: "random-nonce-12345",
	issuedAt: new Date().toISOString(),
	expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const formatted = formatMessage(siweObj);
const minimalSiwe: SiweMessage = {
	domain: "minimal.example.com",
	address: "0x1111111111111111111111111111111111111111",
	uri: "https://minimal.example.com",
	version: "1",
	chainId: 1,
	nonce: "nonce123",
	issuedAt: new Date().toISOString(),
};

const minimalFormatted = formatMessage(minimalSiwe);
const transferLog: EventLog = {
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
	topics: [
		"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer(address,address,uint256)
		"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0", // from
		"0x000000000000000000000000e92a8b5a75c16874ae6a25c44a8e7e2e3c2c4e5c", // to
	],
	data: "0x0000000000000000000000000000000000000000000000000000000005f5e100", // 100000000 (100 USDC with 6 decimals)
	blockNumber: 19000000n,
	transactionHash: "0x1234...",
	transactionIndex: 50,
	blockHash: "0x5678...",
	logIndex: 25,
};

const transferSignature: EventSignature = {
	name: "Transfer",
	inputs: [
		{ name: "from", type: "address", indexed: true },
		{ name: "to", type: "address", indexed: true },
		{ name: "value", type: "uint256", indexed: false },
	],
};

const decodedTransfer = parseEventLog(transferLog, transferSignature);
const approvalLog: EventLog = {
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	topics: [
		"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925", // Approval(address,address,uint256)
		"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0", // owner
		"0x0000000000000000000000001111111254eeb25477b68fb85ed929f73a960582", // spender
	],
	data: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // unlimited approval
};

const approvalSignature: EventSignature = {
	name: "Approval",
	inputs: [
		{ name: "owner", type: "address", indexed: true },
		{ name: "spender", type: "address", indexed: true },
		{ name: "value", type: "uint256", indexed: false },
	],
};

const decodedApproval = parseEventLog(approvalLog, approvalSignature);
const logs: EventLog[] = [
	transferLog,
	approvalLog,
	{
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		topics: [
			"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			"0x000000000000000000000000e92a8b5a75c16874ae6a25c44a8e7e2e3c2c4e5c",
			"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0",
		],
		data: "0x00000000000000000000000000000000000000000000000000000000000186a0",
	},
];

// Filter for Transfer events only
const transfersOnly = filterLogsByTopics(logs, [
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
]);

// Filter for transfers from specific address
const fromSpecific = filterLogsByTopics(logs, [
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0",
]);

// Filter for transfers to specific address (using null for topic1)
const toSpecific = filterLogsByTopics(logs, [
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
	null,
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0",
]);
const signatures = [
	"Transfer(address,address,uint256)",
	"Approval(address,address,uint256)",
	"Swap(address,uint256,uint256,uint256,uint256,address)",
];
for (const sig of signatures) {
	const hash = createEventSignatureHash(sig);
}

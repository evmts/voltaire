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
  parseMessage,
  formatMessage,
  validateMessage,
  isExpired,
  isNotYetValid,
  type SiweMessage,
} from '../../src/typescript/primitives/siwe';

import {
  parseEventLog,
  filterLogsByTopics,
  createEventSignatureHash,
  type EventLog,
  type EventSignature,
} from '../../src/typescript/primitives/logs';

console.log('=== SIWE Messages and Event Logs ===\n');

// ========== SIWE Messages ==========

// Example 6.1: Creating and Parsing SIWE Message
console.log('6.1: SIWE Message Parsing');
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

console.log('Raw SIWE message:');
console.log(siweMessage);
console.log();

const parsed = parseMessage(siweMessage);
console.log('Parsed message:', JSON.stringify(parsed, null, 2));
console.log();

// Example 6.2: SIWE Message Validation
console.log('6.2: SIWE Message Validation');
const validMsg = validateMessage(parsed);
console.log('Message valid:', validMsg);

const expired = isExpired(parsed, new Date('2024-01-03').getTime());
console.log('Is expired (checking from 2024-01-03):', expired);

const notYetValid = isNotYetValid(parsed, new Date('2023-12-31').getTime());
console.log('Not yet valid (checking from 2023-12-31):', notYetValid);
console.log();

// Example 6.3: Formatting SIWE Message
console.log('6.3: Formatting SIWE Message');
const siweObj: SiweMessage = {
  domain: 'app.example.com',
  address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  statement: 'Sign in to the application',
  uri: 'https://app.example.com',
  version: '1',
  chainId: 1,
  nonce: 'random-nonce-12345',
  issuedAt: new Date().toISOString(),
  expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const formatted = formatMessage(siweObj);
console.log('Formatted message:');
console.log(formatted);
console.log();

// Example 6.4: SIWE Without Optional Fields
console.log('6.4: Minimal SIWE Message');
const minimalSiwe: SiweMessage = {
  domain: 'minimal.example.com',
  address: '0x1111111111111111111111111111111111111111',
  uri: 'https://minimal.example.com',
  version: '1',
  chainId: 1,
  nonce: 'nonce123',
  issuedAt: new Date().toISOString(),
};

const minimalFormatted = formatMessage(minimalSiwe);
console.log('Minimal SIWE message:');
console.log(minimalFormatted);
console.log();

// ========== Event Logs ==========

// Example 6.5: Parsing Transfer Event
console.log('6.5: Parsing ERC20 Transfer Event');
const transferLog: EventLog = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer(address,address,uint256)
    '0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0', // from
    '0x000000000000000000000000e92a8b5a75c16874ae6a25c44a8e7e2e3c2c4e5c', // to
  ],
  data: '0x0000000000000000000000000000000000000000000000000000000005f5e100', // 100000000 (100 USDC with 6 decimals)
  blockNumber: 19000000n,
  transactionHash: '0x1234...',
  transactionIndex: 50,
  blockHash: '0x5678...',
  logIndex: 25,
};

const transferSignature: EventSignature = {
  name: 'Transfer',
  inputs: [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false },
  ],
};

const decodedTransfer = parseEventLog(transferLog, transferSignature);
console.log('Decoded Transfer event:');
console.log('  Event name:', decodedTransfer.eventName);
console.log('  Contract:', decodedTransfer.address);
console.log('  From:', decodedTransfer.args.from);
console.log('  To:', decodedTransfer.args.to);
console.log('  Data (value):', decodedTransfer.args._data);
console.log('  Block:', transferLog.blockNumber?.toString());
console.log();

// Example 6.6: Parsing Approval Event
console.log('6.6: Parsing ERC20 Approval Event');
const approvalLog: EventLog = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  topics: [
    '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', // Approval(address,address,uint256)
    '0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0', // owner
    '0x0000000000000000000000001111111254eeb25477b68fb85ed929f73a960582', // spender
  ],
  data: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // unlimited approval
};

const approvalSignature: EventSignature = {
  name: 'Approval',
  inputs: [
    { name: 'owner', type: 'address', indexed: true },
    { name: 'spender', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false },
  ],
};

const decodedApproval = parseEventLog(approvalLog, approvalSignature);
console.log('Decoded Approval event:');
console.log('  Event name:', decodedApproval.eventName);
console.log('  Owner:', decodedApproval.args.owner);
console.log('  Spender:', decodedApproval.args.spender);
console.log('  Value:', decodedApproval.args._data);
console.log();

// Example 6.7: Filtering Logs by Topics
console.log('6.7: Filtering Logs by Topics');
const logs: EventLog[] = [
  transferLog,
  approvalLog,
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000e92a8b5a75c16874ae6a25c44a8e7e2e3c2c4e5c',
      '0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0',
    ],
    data: '0x00000000000000000000000000000000000000000000000000000000000186a0',
  },
];

console.log('Total logs:', logs.length);

// Filter for Transfer events only
const transfersOnly = filterLogsByTopics(logs, [
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
]);
console.log('Transfer events:', transfersOnly.length);

// Filter for transfers from specific address
const fromSpecific = filterLogsByTopics(logs, [
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  '0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0',
]);
console.log('Transfers from 0x742d...:', fromSpecific.length);

// Filter for transfers to specific address (using null for topic1)
const toSpecific = filterLogsByTopics(logs, [
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  null,
  '0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0',
]);
console.log('Transfers to 0x742d...:', toSpecific.length);
console.log();

// Example 6.8: Creating Event Signature Hash
console.log('6.8: Creating Event Signature Hashes');
const signatures = [
  'Transfer(address,address,uint256)',
  'Approval(address,address,uint256)',
  'Swap(address,uint256,uint256,uint256,uint256,address)',
];

console.log('Event signature hashes:');
for (const sig of signatures) {
  const hash = createEventSignatureHash(sig);
  console.log(`  ${sig}`);
  console.log(`    ${hash}`);
}

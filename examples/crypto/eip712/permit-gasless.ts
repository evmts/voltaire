/**
 * EIP-712 Permit (ERC-2612) - Gasless Approvals
 *
 * Demonstrates:
 * - ERC-2612 Permit typed data structure
 * - Gasless token approvals via signatures
 * - Meta-transaction pattern
 * - Nonce management
 * - Deadline handling
 */

import * as EIP712 from '../../../src/crypto/Eip712/index.js';
import * as Address from '../../../src/primitives/Address/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

console.log('=== EIP-712 Permit (Gasless Approvals) ===\n');

// Simulate token contract
const USDC_ADDRESS = Address.fromHex('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
const OWNER_PRIVATE_KEY = new Uint8Array(32);
crypto.getRandomValues(OWNER_PRIVATE_KEY);

const SPENDER_ADDRESS = Address.fromHex('0x1234567890123456789012345678901234567890');

// 1. ERC-2612 Permit structure
console.log('1. ERC-2612 Permit Structure');
console.log('-'.repeat(40));

const permit = {
  domain: {
    name: 'USD Coin',
    version: '2',
    chainId: 1n,
    verifyingContract: USDC_ADDRESS,
  },
  types: {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  primaryType: 'Permit',
  message: {
    owner: EIP712.recoverAddress(
      EIP712.signTypedData({ domain: permit.domain, types: permit.types, primaryType: 'Permit', message: {} as any }, OWNER_PRIVATE_KEY),
      { domain: permit.domain, types: permit.types, primaryType: 'Permit', message: {} as any }
    ),
    spender: SPENDER_ADDRESS,
    value: 1000000n, // 1 USDC (6 decimals)
    nonce: 0n,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
  },
};

console.log('Permit details:');
console.log(`  Token: USD Coin (USDC)`);
console.log(`  Owner: ${Address.toHex(permit.message.owner)}`);
console.log(`  Spender: ${Address.toHex(permit.message.spender)}`);
console.log(`  Amount: ${permit.message.value} (1 USDC)`);
console.log(`  Nonce: ${permit.message.nonce}`);
console.log(`  Deadline: ${new Date(Number(permit.message.deadline) * 1000).toISOString()}\n`);

// 2. Sign permit
console.log('2. Sign Permit Off-Chain');
console.log('-'.repeat(40));

const signature = EIP712.signTypedData(permit, OWNER_PRIVATE_KEY);

console.log('Permit signature:');
console.log(`  r: ${Hex.fromBytes(signature.r)}`);
console.log(`  s: ${Hex.fromBytes(signature.s)}`);
console.log(`  v: ${signature.v}`);

console.log('\n✓ Signature created off-chain (no gas cost)');
console.log('✓ Can be submitted by anyone (relayer pays gas)\n');

// 3. Verify permit
console.log('3. Verify Permit');
console.log('-'.repeat(40));

const recoveredOwner = EIP712.recoverAddress(signature, permit);

console.log(`Recovered owner: ${Address.toHex(recoveredOwner)}`);
console.log(`Expected owner:  ${Address.toHex(permit.message.owner)}`);
console.log(`Match: ${Address.toHex(recoveredOwner).toLowerCase() === Address.toHex(permit.message.owner).toLowerCase()}`);

const isValid = EIP712.verifyTypedData(signature, permit, permit.message.owner);
console.log(`Signature valid: ${isValid ? '✓' : '✗'}\n`);

// 4. Nonce management
console.log('4. Nonce Management (Replay Protection)');
console.log('-'.repeat(40));

console.log('Creating multiple permits with incrementing nonces:\n');

for (let nonce = 0n; nonce < 3n; nonce++) {
  const noncePermit = {
    ...permit,
    message: {
      ...permit.message,
      nonce,
    },
  };

  const sig = EIP712.signTypedData(noncePermit, OWNER_PRIVATE_KEY);
  const hash = EIP712.hashTypedData(noncePermit);

  console.log(`Nonce ${nonce}:`);
  console.log(`  Hash: ${Hex.fromBytes(hash).slice(0, 32)}...`);
  console.log(`  Signature r: ${Hex.fromBytes(sig.r).slice(0, 24)}...`);
}

console.log('\n✓ Each nonce produces unique signature');
console.log('✓ Prevents signature replay attacks\n');

// 5. Deadline expiration
console.log('5. Deadline Handling');
console.log('-'.repeat(40));

const now = BigInt(Math.floor(Date.now() / 1000));

const validPermit = {
  ...permit,
  message: {
    ...permit.message,
    deadline: now + 3600n, // 1 hour from now
  },
};

const expiredPermit = {
  ...permit,
  message: {
    ...permit.message,
    nonce: 1n,
    deadline: now - 3600n, // 1 hour ago (expired)
  },
};

console.log('Valid permit:');
console.log(`  Deadline: ${new Date(Number(validPermit.message.deadline) * 1000).toISOString()}`);
console.log(`  Status: ✓ Valid (future deadline)`);

console.log('\nExpired permit:');
console.log(`  Deadline: ${new Date(Number(expiredPermit.message.deadline) * 1000).toISOString()}`);
console.log(`  Status: ✗ Expired (past deadline)`);

console.log('\n✓ Smart contract should reject expired permits\n');

// 6. Gasless approval workflow
console.log('6. Gasless Approval Workflow');
console.log('-'.repeat(40));

console.log('Traditional ERC-20 approval (2 transactions):');
console.log('  1. User calls approve() → pays gas');
console.log('  2. Spender calls transferFrom() → pays gas');
console.log('  Total: 2 transactions, user pays gas');

console.log('\nERC-2612 Permit (1 transaction):');
console.log('  1. User signs permit off-chain → no gas');
console.log('  2. Relayer/Spender calls permit() + action → pays gas');
console.log('  Total: 1 transaction, relayer pays gas');

console.log("\n✓ Better UX: users don't need ETH for gas");
console.log("✓ Fewer transactions: approval + action in one tx");
console.log("✓ Meta-transactions: relayers can pay gas\n");

// 7. Different permit amounts
console.log('7. Different Permit Amounts');
console.log('-'.repeat(40));

const amounts = [
  { value: 1_000000n, desc: '1 USDC' },
  { value: 100_000000n, desc: '100 USDC' },
  { value: 115792089237316195423570985008687907853269984665640564039457584007913129639935n, desc: 'MAX_UINT256 (unlimited)' },
];

console.log('Creating permits for different amounts:\n');

for (const { value, desc } of amounts) {
  const amountPermit = {
    ...permit,
    message: {
      ...permit.message,
      value,
      nonce: value === 1_000000n ? 10n : value === 100_000000n ? 11n : 12n,
    },
  };

  const sig = EIP712.signTypedData(amountPermit, OWNER_PRIVATE_KEY);

  console.log(`${desc}:`);
  console.log(`  Value: ${value}`);
  console.log(`  Signature: ${Hex.fromBytes(sig.r).slice(0, 24)}...`);
}
console.log();

// 8. Domain binding (prevents cross-token replay)
console.log('8. Domain Binding (Cross-Token Protection)');
console.log('-'.repeat(40));

const daiPermit = {
  domain: {
    name: 'Dai Stablecoin',
    version: '1',
    chainId: 1n,
    verifyingContract: Address.fromHex('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
  },
  types: permit.types,
  primaryType: permit.primaryType,
  message: permit.message,
};

const usdcHash = EIP712.hashTypedData(permit);
const daiHash = EIP712.hashTypedData(daiPermit);

console.log('Same permit message, different tokens:');
console.log(`USDC hash: ${Hex.fromBytes(usdcHash).slice(0, 32)}...`);
console.log(`DAI hash:  ${Hex.fromBytes(daiHash).slice(0, 32)}...`);
console.log(`Different: ${Hex.fromBytes(usdcHash) !== Hex.fromBytes(daiHash)}`);
console.log('\n✓ Domain separator prevents cross-token replay\n');

// 9. Meta-transaction example
console.log('9. Meta-Transaction Pattern');
console.log('-'.repeat(40));

console.log('User flow:');
console.log('  1. User signs permit (off-chain, no gas)');
console.log('  2. User sends signature to relayer');
console.log('  3. Relayer submits permit() to contract');
console.log('  4. Contract verifies signature with ecrecover');
console.log('  5. Contract updates approval mapping');
console.log('  6. Relayer can now call transferFrom()');

console.log('\nContract verification (pseudo-code):');
console.log('  address signer = ecrecover(digest, v, r, s);');
console.log('  require(signer == owner, "Invalid signature");');
console.log('  require(block.timestamp <= deadline, "Expired");');
console.log('  require(nonces[owner] == nonce, "Invalid nonce");');
console.log('  nonces[owner]++;');
console.log('  allowance[owner][spender] = value;\n');

// 10. Security recommendations
console.log('10. Security Best Practices');
console.log('-'.repeat(40));

console.log('Permit security:');
console.log('✓ Always include deadline (prevent old permits)');
console.log('✓ Use nonces (prevent replay attacks)');
console.log('✓ Verify domain separator (prevent cross-contract replay)');
console.log('✓ Check chainId (prevent cross-chain replay)');
console.log('✓ Validate signature before executing');
console.log('✓ Increment nonce after use');
console.log('✓ Set reasonable deadlines (1 hour - 1 day)');
console.log('✓ Be careful with MAX_UINT256 approvals');
console.log('✓ Use permit() instead of approve() when possible\n');

console.log('=== Complete ===');

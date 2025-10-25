/**
 * Example usage of @tevm/primitives transaction module
 */

import {
  type LegacyTransaction,
  type Eip1559Transaction,
  type Eip7702Transaction,
  encodeLegacyForSigning,
  encodeEip1559ForSigning,
  encodeEip7702ForSigning,
  hashTransaction,
  validateTransaction,
  detectTransactionType,
  parseTransaction,
} from "./primitives/transaction";

// Example 1: Legacy Transaction
console.log("=== Legacy Transaction ===");
const legacyTx: LegacyTransaction = {
  nonce: 0n,
  gasPrice: 20000000000n, // 20 gwei
  gasLimit: 21000n,
  to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  value: 1000000000000000n, // 0.001 ETH
  data: "0x",
  v: 37n,
  r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
};

const legacyEncoded = encodeLegacyForSigning(legacyTx, 1n);
console.log("Encoded:", legacyEncoded.slice(0, 66) + "...");
console.log("Valid:", validateTransaction(legacyTx));
console.log("Hash:", hashTransaction(legacyTx));
console.log();

// Example 2: EIP-1559 Transaction
console.log("=== EIP-1559 Transaction ===");
const eip1559Tx: Eip1559Transaction = {
  type: "eip1559",
  chainId: 1n,
  nonce: 42n,
  maxPriorityFeePerGas: 2000000000n, // 2 gwei
  maxFeePerGas: 100000000000n, // 100 gwei
  gasLimit: 21000n,
  to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  value: 1000000000000000000n, // 1 ETH
  data: "0x",
  accessList: [],
  v: 1n,
  r: "0xc7cf543e1b26a19fca825d164a0dc96e62c6a4a373d90abcf82b0de7f97e58f5",
  s: "0x6d4b6bc588356822e38a0bec5fb4baa8efd8f19ec90b0584df2bbba09cd78c0d",
};

const eip1559Encoded = encodeEip1559ForSigning(eip1559Tx);
console.log("Encoded:", eip1559Encoded.slice(0, 66) + "...");
console.log("Valid:", validateTransaction(eip1559Tx));
console.log("Hash:", hashTransaction(eip1559Tx));
console.log();

// Example 3: EIP-7702 Transaction with Authorization
console.log("=== EIP-7702 Transaction ===");
const eip7702Tx: Eip7702Transaction = {
  type: "eip7702",
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1000000000n,
  maxFeePerGas: 20000000000n,
  gasLimit: 50000n,
  to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  value: 0n,
  data: "0x",
  accessList: [],
  authorizationList: [
    {
      chainId: 1n,
      address: "0x1111111111111111111111111111111111111111",
      nonce: 0n,
      v: 27n,
      r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    },
  ],
  v: 1n,
  r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
};

const eip7702Encoded = encodeEip7702ForSigning(eip7702Tx);
console.log("Encoded:", eip7702Encoded.slice(0, 66) + "...");
console.log("Valid:", validateTransaction(eip7702Tx));
console.log("Hash:", hashTransaction(eip7702Tx));
console.log();

// Example 4: Parsing and Type Detection
console.log("=== Transaction Parsing ===");
const rawTxData = eip1559Encoded;
const detectedType = detectTransactionType(rawTxData);
console.log("Detected type:", detectedType);

const parsedTx = parseTransaction(rawTxData);
console.log("Parsed transaction type:", parsedTx.type || "legacy");
console.log("Nonce:", parsedTx.nonce);
console.log("Gas limit:", parsedTx.gasLimit);

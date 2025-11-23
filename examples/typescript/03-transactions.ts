/**
 * Example 3: Transaction Types
 *
 * Demonstrates:
 * - Different transaction type structures
 * - Transaction type enums
 */

import * as Transaction from "../../src/primitives/Transaction/index.js";

// Example transaction types - for full usage see Transaction module documentation

// Legacy transaction type (Type 0)
const legacyTxType = Transaction.Type.Legacy; // 0x00

// EIP-2930 transaction type (Type 1)
const eip2930TxType = Transaction.Type.EIP2930; // 0x01

// EIP-1559 transaction type (Type 2)
const eip1559TxType = Transaction.Type.EIP1559; // 0x02

// EIP-4844 blob transaction type (Type 3)
const eip4844TxType = Transaction.Type.EIP4844; // 0x03

// EIP-7702 delegation transaction type (Type 4)
const eip7702TxType = Transaction.Type.EIP7702; // 0x04

// Note: Transaction construction and encoding requires proper branded types
// (BrandedAddress, HashType, etc.). See the Transaction module documentation
// for complete examples of creating and encoding transactions.

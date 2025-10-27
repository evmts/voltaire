[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / TransactionType

# Enumeration: TransactionType

Defined in: [primitives/transaction.wasm.ts:11](https://github.com/evmts/primitives/blob/main/src/primitives/transaction.wasm.ts#L11)

Transaction type enumeration

## Enumeration Members

### EIP1559

> **EIP1559**: `2`

Defined in: [primitives/transaction.wasm.ts:17](https://github.com/evmts/primitives/blob/main/src/primitives/transaction.wasm.ts#L17)

EIP-1559 fee market transaction

***

### EIP2930

> **EIP2930**: `1`

Defined in: [primitives/transaction.wasm.ts:15](https://github.com/evmts/primitives/blob/main/src/primitives/transaction.wasm.ts#L15)

EIP-2930 access list transaction

***

### EIP4844

> **EIP4844**: `3`

Defined in: [primitives/transaction.wasm.ts:19](https://github.com/evmts/primitives/blob/main/src/primitives/transaction.wasm.ts#L19)

EIP-4844 blob transaction

***

### EIP7702

> **EIP7702**: `4`

Defined in: [primitives/transaction.wasm.ts:21](https://github.com/evmts/primitives/blob/main/src/primitives/transaction.wasm.ts#L21)

EIP-7702 set code transaction

***

### Legacy

> **Legacy**: `0`

Defined in: [primitives/transaction.wasm.ts:13](https://github.com/evmts/primitives/blob/main/src/primitives/transaction.wasm.ts#L13)

Legacy transaction (pre-EIP-2718)

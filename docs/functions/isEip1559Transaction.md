[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / isEip1559Transaction

# Function: isEip1559Transaction()

> **isEip1559Transaction**(`tx`): `` tx is TransactionInfo & { maxFeePerGas: `0x${string}`; maxPriorityFeePerGas: `0x${string}` } ``

Defined in: [ethereum-types/transaction-info.ts:152](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L152)

Type guard to check if a transaction is EIP-1559

## Parameters

### tx

[`TransactionInfo`](../interfaces/TransactionInfo.md)

## Returns

`` tx is TransactionInfo & { maxFeePerGas: `0x${string}`; maxPriorityFeePerGas: `0x${string}` } ``

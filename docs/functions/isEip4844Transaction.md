[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / isEip4844Transaction

# Function: isEip4844Transaction()

> **isEip4844Transaction**(`tx`): `` tx is TransactionInfo & { blobVersionedHashes: `0x${string}`[]; maxFeePerBlobGas: `0x${string}` } ``

Defined in: [ethereum-types/transaction-info.ts:164](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L164)

Type guard to check if a transaction is EIP-4844

## Parameters

### tx

[`TransactionInfo`](../interfaces/TransactionInfo.md)

## Returns

`` tx is TransactionInfo & { blobVersionedHashes: `0x${string}`[]; maxFeePerBlobGas: `0x${string}` } ``

[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / detectTransactionType

# Function: detectTransactionType()

> **detectTransactionType**(`data`): [`TransactionType`](../enumerations/TransactionType.md)

Defined in: [primitives/transaction.wasm.ts:29](https://github.com/evmts/primitives/blob/main/src/primitives/transaction.wasm.ts#L29)

Detect transaction type from RLP-encoded data

## Parameters

### data

`Uint8Array`

RLP-encoded transaction data

## Returns

[`TransactionType`](../enumerations/TransactionType.md)

Transaction type (0-4)

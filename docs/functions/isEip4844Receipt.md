[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / isEip4844Receipt

# Function: isEip4844Receipt()

> **isEip4844Receipt**(`receipt`): `` receipt is ReceiptInfo & { blobGasPrice: `0x${string}`; blobGasUsed: `0x${string}` } ``

Defined in: [ethereum-types/receipt-info.ts:105](https://github.com/evmts/primitives/blob/main/src/ethereum-types/receipt-info.ts#L105)

Type guard to check if receipt is for EIP-4844 transaction

## Parameters

### receipt

[`ReceiptInfo`](../interfaces/ReceiptInfo.md)

## Returns

`` receipt is ReceiptInfo & { blobGasPrice: `0x${string}`; blobGasUsed: `0x${string}` } ``

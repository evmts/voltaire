[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / TransactionInfo

# Interface: TransactionInfo

Defined in: [ethereum-types/transaction-info.ts:26](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L26)

Transaction with block context

This is the full transaction object returned by JSON-RPC methods that includes
the block information where the transaction was included.

## Properties

### accessList?

> `optional` **accessList**: [`AccessListItem`](AccessListItem.md)[]

Defined in: [ethereum-types/transaction-info.ts:85](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L85)

Access list (EIP-2930, EIP-1559, EIP-4844, EIP-7702)

***

### authorizationList?

> `optional` **authorizationList**: [`Authorization`](Authorization.md)[]

Defined in: [ethereum-types/transaction-info.ts:96](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L96)

Authorization list (EIP-7702)

***

### blobVersionedHashes?

> `optional` **blobVersionedHashes**: `` `0x${string}` ``[]

Defined in: [ethereum-types/transaction-info.ts:92](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L92)

Blob versioned hashes (EIP-4844)

***

### blockHash

> **blockHash**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:28](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L28)

Hash of the block containing this transaction

***

### blockNumber

> **blockNumber**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:31](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L31)

Number of the block containing this transaction

***

### chainId?

> `optional` **chainId**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:70](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L70)

Chain ID (for replay protection)

***

### from

> **from**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:34](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L34)

Address of the sender

***

### gas

> **gas**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:49](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L49)

Gas provided by the sender

***

### gasPrice?

> `optional` **gasPrice**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:74](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L74)

Gas price (legacy transactions)

***

### hash

> **hash**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:37](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L37)

Hash of the transaction

***

### input

> **input**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:55](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L55)

Input data

***

### maxFeePerBlobGas?

> `optional` **maxFeePerBlobGas**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:89](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L89)

Maximum fee per blob gas (EIP-4844)

***

### maxFeePerGas?

> `optional` **maxFeePerGas**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:78](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L78)

Maximum fee per gas (EIP-1559)

***

### maxPriorityFeePerGas?

> `optional` **maxPriorityFeePerGas**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:81](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L81)

Maximum priority fee per gas (EIP-1559)

***

### nonce

> **nonce**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:58](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L58)

Transaction nonce

***

### r

> **r**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:61](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L61)

ECDSA signature r

***

### s

> **s**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:64](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L64)

ECDSA signature s

***

### to

> **to**: `` `0x${string}` `` \| `null`

Defined in: [ethereum-types/transaction-info.ts:46](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L46)

Address of the receiver, null for contract creation

***

### transactionIndex

> **transactionIndex**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:40](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L40)

Position of the transaction in the block

***

### type

> **type**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:43](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L43)

Transaction type (0x0 for legacy, 0x1 for EIP-2930, 0x2 for EIP-1559, 0x3 for EIP-4844, 0x4 for EIP-7702)

***

### v

> **v**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:67](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L67)

ECDSA signature v

***

### value

> **value**: `` `0x${string}` ``

Defined in: [ethereum-types/transaction-info.ts:52](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L52)

Value transferred in wei

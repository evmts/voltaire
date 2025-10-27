[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / BlockInfo

# Interface: BlockInfo

Defined in: [ethereum-types/block.ts:23](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L23)

Block header information

## Properties

### baseFeePerGas?

> `optional` **baseFeePerGas**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:80](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L80)

Base fee per gas (EIP-1559)

***

### blobGasUsed?

> `optional` **blobGasUsed**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:91](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L91)

Total blob gas used in this block (EIP-4844)

***

### difficulty

> **difficulty**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:52](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L52)

Difficulty of this block (0 for proof-of-stake)

***

### excessBlobGas?

> `optional` **excessBlobGas**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:94](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L94)

Excess blob gas (EIP-4844)

***

### extraData

> **extraData**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:58](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L58)

Arbitrary data included in the block

***

### gasLimit

> **gasLimit**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:61](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L61)

Maximum gas allowed in this block

***

### gasUsed

> **gasUsed**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:64](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L64)

Total gas used by all transactions in this block

***

### hash

> **hash**: `` `0x${string}` `` \| `null`

Defined in: [ethereum-types/block.ts:28](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L28)

Block hash, null for pending blocks

***

### logsBloom

> **logsBloom**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:37](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L37)

Bloom filter for logs in the block

***

### miner

> **miner**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:49](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L49)

Address of the miner/validator who created this block

***

### mixHash?

> `optional` **mixHash**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:101](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L101)

Mix hash / previous Randao (post-merge)

***

### nonce?

> `optional` **nonce**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:104](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L104)

Nonce (proof-of-work only, 0 for proof-of-stake)

***

### number

> **number**: `` `0x${string}` `` \| `null`

Defined in: [ethereum-types/block.ts:25](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L25)

Block number, null for pending blocks

***

### parentBeaconBlockRoot?

> `optional` **parentBeaconBlockRoot**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:97](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L97)

Parent beacon block root (EIP-4788)

***

### parentHash

> **parentHash**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:31](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L31)

Hash of the parent block

***

### receiptsRoot

> **receiptsRoot**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:46](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L46)

Root of the receipts trie

***

### sha3Uncles

> **sha3Uncles**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:34](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L34)

SHA3 of the uncles data in the block

***

### size

> **size**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:70](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L70)

Size of the block in bytes

***

### stateRoot

> **stateRoot**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:43](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L43)

Root of the state trie

***

### timestamp

> **timestamp**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:67](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L67)

Unix timestamp of block creation

***

### totalDifficulty?

> `optional` **totalDifficulty**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:55](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L55)

Total difficulty up to this block (removed post-merge)

***

### transactions

> **transactions**: readonly (`` `0x${string}` `` \| [`TransactionInBlock`](TransactionInBlock.md))[]

Defined in: [ethereum-types/block.ts:73](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L73)

Array of transaction hashes or full transaction objects

***

### transactionsRoot

> **transactionsRoot**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:40](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L40)

Root of the transaction trie

***

### uncles

> **uncles**: readonly `` `0x${string}` ``[]

Defined in: [ethereum-types/block.ts:76](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L76)

Array of uncle block hashes

***

### withdrawals?

> `optional` **withdrawals**: readonly [`Withdrawal`](Withdrawal.md)[]

Defined in: [ethereum-types/block.ts:87](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L87)

Array of withdrawal objects (EIP-4895)

***

### withdrawalsRoot?

> `optional` **withdrawalsRoot**: `` `0x${string}` ``

Defined in: [ethereum-types/block.ts:84](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L84)

Root of the withdrawals trie (EIP-4895)

[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / isPostShanghaiBlock

# Function: isPostShanghaiBlock()

> **isPostShanghaiBlock**(`block`): `` block is BlockInfo & { withdrawals: readonly Withdrawal[]; withdrawalsRoot: `0x${string}` } ``

Defined in: [ethereum-types/block.ts:178](https://github.com/evmts/primitives/blob/main/src/ethereum-types/block.ts#L178)

Type guard to check if block is post-Shanghai (has withdrawals)

## Parameters

### block

[`BlockInfo`](../interfaces/BlockInfo.md)

## Returns

`` block is BlockInfo & { withdrawals: readonly Withdrawal[]; withdrawalsRoot: `0x${string}` } ``

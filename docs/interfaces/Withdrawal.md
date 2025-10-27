[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / Withdrawal

# Interface: Withdrawal

Defined in: [ethereum-types/withdrawal.ts:18](https://github.com/evmts/primitives/blob/main/src/ethereum-types/withdrawal.ts#L18)

Validator withdrawal

Withdrawals move ETH from the beacon chain (consensus layer) to
the execution layer. They appear in blocks after the Shanghai upgrade.

## Properties

### address

> **address**: `` `0x${string}` ``

Defined in: [ethereum-types/withdrawal.ts:26](https://github.com/evmts/primitives/blob/main/src/ethereum-types/withdrawal.ts#L26)

Target address for withdrawn ether

***

### amount

> **amount**: `` `0x${string}` ``

Defined in: [ethereum-types/withdrawal.ts:29](https://github.com/evmts/primitives/blob/main/src/ethereum-types/withdrawal.ts#L29)

Amount of withdrawn ether in Gwei (1 ETH = 1,000,000,000 Gwei)

***

### index

> **index**: `` `0x${string}` ``

Defined in: [ethereum-types/withdrawal.ts:20](https://github.com/evmts/primitives/blob/main/src/ethereum-types/withdrawal.ts#L20)

Monotonically increasing identifier issued by consensus layer

***

### validatorIndex

> **validatorIndex**: `` `0x${string}` ``

Defined in: [ethereum-types/withdrawal.ts:23](https://github.com/evmts/primitives/blob/main/src/ethereum-types/withdrawal.ts#L23)

Index of validator associated with withdrawal

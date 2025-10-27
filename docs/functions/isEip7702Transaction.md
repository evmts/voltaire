[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / isEip7702Transaction

# Function: isEip7702Transaction()

> **isEip7702Transaction**(`tx`): `tx is TransactionInfo & { authorizationList: Authorization[] }`

Defined in: [ethereum-types/transaction-info.ts:176](https://github.com/evmts/primitives/blob/main/src/ethereum-types/transaction-info.ts#L176)

Type guard to check if a transaction is EIP-7702

## Parameters

### tx

[`TransactionInfo`](../interfaces/TransactionInfo.md)

## Returns

`tx is TransactionInfo & { authorizationList: Authorization[] }`

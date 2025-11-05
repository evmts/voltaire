# calculateCreateAddress

Calculate contract address for CREATE opcode deployment.

## Signature

```typescript
function calculateCreateAddress(
  address: BrandedAddress,
  nonce: bigint
): BrandedAddress
```

## Algorithm

```
address = keccak256(rlp([sender, nonce]))[12:32]
```

1. Convert nonce to minimal byte representation (0n → empty bytes)
2. RLP encode [sender_address, nonce_bytes]
3. Keccak256 hash the encoded data
4. Take bytes 12-32 (last 20 bytes) as contract address

## Parameters

- `address`: Deployer address (20 bytes)
- `nonce`: Transaction nonce (non-negative bigint)

## Returns

`BrandedAddress` - Deterministic contract address

## Throws

[`InvalidValueError`](./errors.js.md#invalidvalueerror) - Nonce negative

## Example

```typescript
const contractAddr = Address.calculateCreateAddress(deployerAddr, 5n);
```

## See Also

- [calculateCreate2Address](./calculateCreate2Address.js.md) - Calculate CREATE2 contract address

# calculateCreate2Address

Calculate contract address for CREATE2 opcode deployment (EIP-1014).

## Signature

```typescript
function calculateCreate2Address(
  address: BrandedAddress,
  salt: Uint8Array,
  initCode: Uint8Array
): BrandedAddress
```

## Algorithm

```
address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
```

1. Hash initCode with keccak256
2. Concatenate: `0xff` (1 byte) + sender (20 bytes) + salt (32 bytes) + initCodeHash (32 bytes)
3. Keccak256 hash the concatenated data (85 bytes total)
4. Take bytes 12-32 (last 20 bytes) as contract address

## Parameters

- `address`: Deployer address (20 bytes)
- `salt`: 32-byte deterministic salt
- `initCode`: Contract initialization bytecode

## Returns

`BrandedAddress` - Deterministic contract address

## Throws

`Error` - Salt not 32 bytes

## Example

```typescript
const contractAddr = Address.calculateCreate2Address(
  deployerAddr,
  saltBytes,
  initCode
);
```

## See Also

- [calculateCreateAddress](./calculateCreateAddress.js.md) - Calculate CREATE contract address

# fromPublicKey

Create Address from secp256k1 public key.

## Signature

```typescript
fromPublicKey(x: bigint, y: bigint): BrandedAddress
```

## Parameters

- `x` - Public key x coordinate
- `y` - Public key y coordinate

## Returns

`BrandedAddress` - Last 20 bytes of keccak256(pubkey)

## Throws

None

## Example

```typescript
const addr = Address.fromPublicKey(xCoord, yCoord);
```

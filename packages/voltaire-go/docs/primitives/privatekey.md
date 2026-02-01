# PrivateKey

32-byte secp256k1 private key for signing Ethereum transactions and messages.

## Overview

PrivateKey represents a 32-byte secp256k1 private key used for signing Ethereum transactions, messages, and deriving public keys and addresses. Uses decred/secp256k1 for elliptic curve operations.

## Type Definition

```go
type PrivateKey [32]byte
```

## Usage

### Create PrivateKey

```go
import "github.com/voltaire-labs/voltaire-go/primitives/privatekey"

// Generate random key
pk, err := privatekey.Generate()

// From hex string
pk, err := privatekey.FromHex("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")

// Panic on error (for tests/known values)
pk := privatekey.MustFromHex("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")

// From byte slice
pk, err := privatekey.FromBytes(bytes)
```

### Derive Public Key

```go
pubKey := pk.PublicKey()
// Returns 64-byte uncompressed public key (without 0x04 prefix)
```

### Derive Address

```go
addr := pk.Address()
// Returns 20-byte Ethereum address
```

### Sign Message Hash

```go
sig, err := pk.Sign(hash)
// Returns 65-byte signature (r + s + v)
```

### Convert to Hex

```go
hex := pk.Hex()
// "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
```

**WARNING**: Converting private keys to hex exposes sensitive data. Only use for debugging or secure storage.

### Validation

```go
if pk.IsValid() {
    // Key is in valid range [1, n-1]
}
```

## API Reference

### Constructors

| Function | Description |
|----------|-------------|
| `Generate()` | Create from crypto/rand |
| `FromHex(s)` | Create from hex string |
| `FromBytes(b)` | Create from byte slice |
| `MustFromHex(s)` | Create from hex, panic on error |

### Methods

| Method | Description |
|--------|-------------|
| `Hex()` | Convert to 0x-prefixed hex string |
| `Bytes()` | Return as byte slice |
| `PublicKey()` | Derive uncompressed 64-byte public key |
| `Address()` | Derive 20-byte Ethereum address |
| `IsValid()` | Check if key is in valid range |
| `Sign(hash)` | Create ECDSA signature from 32-byte hash |
| `SignMessage(msg)` | Hash message with keccak256 then sign |

## Key Derivation

```
PrivateKey (32 bytes)
    |
    v
secp256k1.PubkeyFromSeckey()
    |
    v
PublicKey (64 bytes, uncompressed)
    |
    v
keccak256(publicKey)
    |
    v
last 20 bytes
    |
    v
Address (20 bytes)
```

## Validation Rules

Private keys must satisfy:
- Length: exactly 32 bytes
- Value > 0 (not all zeros)
- Value < curve order (0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141)

## Security

**WARNING**: Private keys are sensitive cryptographic secrets.

### Best Practices

1. **Never log private keys** - Use secure logging that redacts keys
2. **Store encrypted** - Use keystore files or hardware wallets
3. **Clear from memory** - Zero out key material after use
4. **Use HD derivation** - Derive keys from mnemonic seeds

### Secure Key Handling

```go
// Generate random key
pk, err := privatekey.Generate()
if err != nil {
    return err
}

// Use the key
sig, err := pk.Sign(hash)

// Clear key from memory when done
for i := range pk {
    pk[i] = 0
}
```

## Test Vectors

```go
// Hardhat/Anvil default account #0
pk := privatekey.MustFromHex(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
)

addr := pk.Address()
// 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## Dependencies

Uses `github.com/decred/dcrd/dcrec/secp256k1/v4` for:
- secp256k1 public key derivation
- ECDSA signing with recovery
- Curve operations

## See Also

- [PublicKey](./publickey.md) - Public key primitive
- [Address](./address.md) - Ethereum address
- [Signature](./signature.md) - ECDSA signatures

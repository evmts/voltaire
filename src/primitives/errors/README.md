# Error Hierarchy

Unified error types for primitive validation and operations.

## Hierarchy

```
Error
└── PrimitiveError (base for all primitive errors)
    ├── ValidationError (input validation)
    │   ├── InvalidFormatError (wrong format)
    │   ├── InvalidLengthError (wrong length)
    │   ├── InvalidRangeError (out of bounds)
    │   └── InvalidChecksumError (checksum mismatch)
    ├── SerializationError (encoding/decoding)
    │   ├── EncodingError (serialization failure)
    │   └── DecodingError (deserialization failure)
    ├── CryptoError (cryptographic operations)
    │   ├── InvalidSignatureError (signature verification)
    │   ├── InvalidPublicKeyError (malformed public key)
    │   └── InvalidPrivateKeyError (invalid private key)
    └── TransactionError (transaction operations)
        ├── InvalidTransactionTypeError (unsupported type)
        └── InvalidSignerError (signer mismatch)
```

## Features

- **Error codes**: Programmatic error handling via `code` property
- **Context data**: Debugging info via `context` property
- **Type-safe**: Full TypeScript type checking
- **Stack traces**: Proper stack trace preservation
- **instanceof**: Standard error hierarchy checks

## Usage

### Basic Example

```typescript
import { InvalidFormatError } from '@tevm/primitives';

function validateAddress(value: string) {
  if (!value.startsWith('0x')) {
    throw new InvalidFormatError("Invalid address format", {
      code: "INVALID_ADDRESS",
      value,
      expected: "0x-prefixed 20 bytes",
      context: { length: value.length }
    });
  }
}
```

### Error Handling

```typescript
try {
  validateAddress("deadbeef");
} catch (e) {
  if (e instanceof InvalidFormatError) {
    console.error(e.code);      // "INVALID_ADDRESS"
    console.error(e.value);     // "deadbeef"
    console.error(e.expected);  // "0x-prefixed 20 bytes"
    console.error(e.context);   // { length: 8 }
  }
}
```

### Programmatic Handling

```typescript
function handleError(err: Error) {
  if (err instanceof InvalidFormatError) {
    return "Please check your input format";
  }
  if (err instanceof InvalidLengthError) {
    return "Input has wrong length";
  }
  if (err instanceof ValidationError) {
    return "Validation failed";
  }
  if (err instanceof PrimitiveError) {
    return "Primitive operation failed";
  }
  return "Unknown error";
}
```

## Error Types

### PrimitiveError

Base error for all primitive operations.

```typescript
new PrimitiveError(message, { code?, context? })
```

### ValidationError

Base validation error with `value` and `expected` fields.

```typescript
new ValidationError(message, { code?, value, expected, context? })
```

#### InvalidFormatError

Wrong format (e.g., missing 0x prefix, invalid characters).

```typescript
new InvalidFormatError(message, { code?, value, expected, context? })
// Default code: "INVALID_FORMAT"
```

#### InvalidLengthError

Wrong byte length.

```typescript
new InvalidLengthError(message, { code?, value, expected, context? })
// Default code: "INVALID_LENGTH"
```

#### InvalidRangeError

Value out of bounds.

```typescript
new InvalidRangeError(message, { code?, value, expected, context? })
// Default code: "INVALID_RANGE"
```

#### InvalidChecksumError

Checksum verification failed (e.g., EIP-55).

```typescript
new InvalidChecksumError(message, { code?, value, expected, context? })
// Default code: "INVALID_CHECKSUM"
```

### SerializationError

Base serialization/deserialization error.

```typescript
new SerializationError(message, { code?, context? })
```

#### EncodingError

Encoding/serialization failed.

```typescript
new EncodingError(message, { code?, context? })
// Default code: "ENCODING_ERROR"
```

#### DecodingError

Decoding/deserialization failed.

```typescript
new DecodingError(message, { code?, context? })
// Default code: "DECODING_ERROR"
```

### CryptoError

Base cryptographic operation error.

```typescript
new CryptoError(message, { code?, context? })
```

#### InvalidSignatureError

Signature verification failed.

```typescript
new InvalidSignatureError(message, { code?, context? })
// Default code: "INVALID_SIGNATURE"
```

#### InvalidPublicKeyError

Malformed public key.

```typescript
new InvalidPublicKeyError(message, { code?, context? })
// Default code: "INVALID_PUBLIC_KEY"
```

#### InvalidPrivateKeyError

Invalid private key (e.g., out of curve order).

```typescript
new InvalidPrivateKeyError(message, { code?, context? })
// Default code: "INVALID_PRIVATE_KEY"
```

### TransactionError

Base transaction operation error.

```typescript
new TransactionError(message, { code?, context? })
```

#### InvalidTransactionTypeError

Unsupported transaction type.

```typescript
new InvalidTransactionTypeError(message, { code?, context? })
// Default code: "INVALID_TRANSACTION_TYPE"
```

#### InvalidSignerError

Transaction signer doesn't match expected.

```typescript
new InvalidSignerError(message, { code?, context? })
// Default code: "INVALID_SIGNER"
```

## Testing

```bash
bun run test -- errors
```

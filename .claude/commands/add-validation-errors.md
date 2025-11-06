# Create Validation Error Hierarchy

**Priority: LOW**

No unified error types for validation failures.

## Task
Create error hierarchy for primitive validation.

## Error Classes to Add

```typescript
// Base error
class PrimitiveError extends Error {
  code: string;
  context?: Record<string, any>;
}

// Validation errors
class ValidationError extends PrimitiveError {
  value: any;
  expected: string;
}

class InvalidFormatError extends ValidationError {}
class InvalidLengthError extends ValidationError {}
class InvalidRangeError extends ValidationError {}
class InvalidChecksumError extends ValidationError {}

// Serialization errors
class SerializationError extends PrimitiveError {}
class EncodingError extends SerializationError {}
class DecodingError extends SerializationError {}

// Crypto errors
class CryptoError extends PrimitiveError {}
class InvalidSignatureError extends CryptoError {}
class InvalidPublicKeyError extends CryptoError {}
class InvalidPrivateKeyError extends CryptoError {}

// Transaction errors
class TransactionError extends PrimitiveError {}
class InvalidTransactionTypeError extends TransactionError {}
class InvalidSignerError extends TransactionError {}
```

## Features
- Error codes for programmatic handling
- Context data for debugging
- Type-safe error matching
- Consistent error messages

## Usage
```typescript
if (!isValidAddress(value)) {
  throw new InvalidFormatError(
    "Invalid address format",
    { code: "INVALID_ADDRESS", value, expected: "0x-prefixed 20 bytes" }
  );
}
```

## Files
Create `src/primitives/errors/` or `src/errors/`

## Verification
```bash
bun run test -- errors
```

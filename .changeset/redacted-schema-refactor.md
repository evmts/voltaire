---
"voltaire-effect": patch
---

Simplify Redacted schema implementations using `S.Redacted` pipe

Before:
```typescript
export const RedactedBytes = S.transformOrFail(S.Uint8ArrayFromSelf, S.Redacted(PrivateKeyTypeSchema), {
  decode: (bytes, _options, ast) => {
    try {
      return ParseResult.succeed(Redacted.make(PrivateKey.fromBytes(bytes)));
    } catch (e) {
      return ParseResult.fail(new ParseResult.Type(ast, bytes, "Invalid private key format"));
    }
  },
  encode: (redacted, _options, ast) => { /* ... */ },
})
```

After:
```typescript
export const RedactedBytes = Bytes.pipe(S.Redacted).annotations({
  identifier: "PrivateKey.RedactedBytes",
  title: "Private Key (Redacted)",
  description: "A 32-byte secp256k1 private key wrapped in Redacted",
})
```

Preserves underlying schema error chain for better error messages.

Commit: 90db5ee93

---
"voltaire-effect": patch
---

Update PrivateKey error test snapshots for new Redacted schema structure

Error output now shows full transformation chain:

```
PrivateKey.RedactedBytes
└─ Encoded side transformation failure
   └─ PrivateKey.Bytes
      └─ Transformation process failure
         └─ Private key must be 32 bytes, got 31

Docs: https://voltaire.dev/primitives/private-key
```

Commit: 19fbca982

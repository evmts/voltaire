---
"@tevm/voltaire": patch
---

Harden keystore decryption and BIP-32 index parsing:

- `Keystore.decrypt` throws `DecryptionError` unless `cipher` is `aes-128-ctr`, the IV is 16 bytes, the MAC is 32 bytes, and `dklen` is an integer >= 32. A forged keystore with `dklen: 16` previously produced an empty MAC key, so `mac = keccak256(ciphertext)` passed for any password.
- `HDWallet.parseIndex` accepts only a whole decimal integer in `[0, 2^31 - 1]` with an optional `'`, `h`, or `H` suffix. It now throws `InvalidPathError` for `"1.5"`, `"1abc"`, `"0x10"`, and indices >= 2^31, which it previously truncated or passed through.

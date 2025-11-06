# Implement ENS Support

## Context

OX comparison revealed they have ENS (Ethereum Name Service) support. ENS provides human-readable names for Ethereum addresses and is widely used. Adding ENS support would improve developer experience.

## Requirements

1. **Name Normalization**:
   ```typescript
   // In src/primitives/Ens/ or similar
   export function normalize(name: string): string
   // Uses UTS-46 normalization via @adraffy/ens-normalize
   ```

2. **Namehash**:
   ```typescript
   export function namehash(name: string): Hash
   // Computes ENS namehash per EIP-137
   ```

3. **Label Hash**:
   ```typescript
   export function labelhash(label: string): Hash
   // Computes keccak256 of normalized label
   ```

4. **Name Validation**:
   ```typescript
   export function isValid(name: string): boolean
   export function validate(name: string): void // throws if invalid
   ```

5. **Implementation**:
   - **Option A**: Wrap @adraffy/ens-normalize for normalization (OX approach)
   - **Option B**: Implement normalization in Zig (complex Unicode tables)
   - **Recommendation**: Option A (complex spec, well-tested library exists)
   - Implement namehash in Zig (simple recursive keccak256)

6. **Testing**:
   - Test vectors from ENS docs
   - Test normalization edge cases
   - Test namehash computation
   - Cross-validate with OX
   - Test invalid names rejection

7. **Documentation**:
   - JSDoc with ENS examples
   - Link to EIP-137, EIP-181
   - Explain normalization process
   - Common use cases

## Reference

OX implementation: `node_modules/ox/core/Ens.ts`
Dependency: @adraffy/ens-normalize

## Priority

**MEDIUM** - Nice-to-have for developer experience

## Notes

- ENS normalization is complex (Unicode normalization, emoji handling)
- Using battle-tested @adraffy/ens-normalize is pragmatic
- Focus implementation effort on namehash and validation
- Consider adding ENS resolution (requires RPC calls) in future

# Implement SIWE (Sign-In With Ethereum)

## Context

OX comparison revealed they have SIWE support. SIWE (EIP-4361) is a standard for authentication using Ethereum accounts. Widely adopted for Web3 authentication.

## Requirements

1. **Message Creation**:
   ```typescript
   // In src/primitives/Siwe/ or similar
   export interface SiweMessage {
     domain: string
     address: Address
     statement?: string
     uri: string
     version: '1'
     chainId: number
     nonce: string
     issuedAt: string
     expirationTime?: string
     notBefore?: string
     requestId?: string
     resources?: string[]
   }

   export function createMessage(params: SiweMessage): string
   export function parseMessage(message: string): SiweMessage
   ```

2. **Message Validation**:
   ```typescript
   export function validateMessage(message: SiweMessage): void
   export function isValid(message: string): boolean
   ```

3. **Signing & Verification**:
   ```typescript
   export function signMessage(message: SiweMessage, privateKey: PrivateKey): Signature
   export function verifyMessage(message: string, signature: Signature): boolean
   export function recoverAddress(message: string, signature: Signature): Address
   ```

4. **Message Format (EIP-4361)**:
   ```
   ${domain} wants you to sign in with your Ethereum account:
   ${address}

   ${statement}

   URI: ${uri}
   Version: ${version}
   Chain ID: ${chainId}
   Nonce: ${nonce}
   Issued At: ${issuedAt}
   Expiration Time: ${expirationTime}
   Not Before: ${notBefore}
   Request ID: ${requestId}
   Resources:
   - ${resources[0]}
   - ${resources[1]}
   ```

5. **Validation Rules**:
   - Domain: Valid hostname
   - Address: Valid Ethereum address
   - URI: Valid URI
   - Version: Must be '1'
   - ChainId: Valid chain ID
   - Nonce: Min 8 chars alphanumeric
   - Timestamps: ISO 8601 format
   - Resources: Valid URIs

6. **Testing**:
   - Test message creation and parsing
   - Test all optional fields
   - Test round-trip: parse(create(msg)) == msg
   - Test validation rules
   - Test signature verification
   - Cross-validate with OX

7. **Documentation**:
   - JSDoc with SIWE examples
   - Link to EIP-4361
   - Common authentication flow
   - Security considerations (nonce, expiration)

## Reference

OX implementation: `node_modules/ox/core/Siwe.ts`
Spec: EIP-4361 (https://eips.ethereum.org/EIPS/eip-4361)

## Priority

**MEDIUM** - Valuable for authentication use cases

## Notes

- SIWE is primarily string formatting and validation
- Can be implemented in TypeScript (no need for Zig)
- Uses existing signing/verification primitives
- Consider adding session management helpers in future

# Voltaire Mintlify Documentation

## Migration Status

**Complete** - All documentation migrated from Starlight to Mintlify (316 pages)
- Getting Started: 2 pages
- Concepts: 2 pages
- Primitives: 215 pages (23 modules)
- Cryptography: 76 pages (17 modules)
- Precompiles: 21 pages

## Working relationship
- You can push back on ideas - this can lead to better documentation. Cite sources and explain your reasoning when you do so
- ALWAYS ask for clarification rather than making assumptions
- NEVER lie, guess, or make up anything
- Brief, concise communication - sacrifice grammar for brevity when appropriate
- No fluff like "Congratulations" or "Success" - just facts

## Project context
- **Format**: MDX files with YAML frontmatter
- **Config**: mint.json for navigation, theme, settings
- **Components**: Mintlify built-in components (Tabs, Tab, Accordion, Tip, Warning, Note, etc.)
- **Architecture**: Ethereum primitives + crypto library for TypeScript and Zig
- **Main docs location**: `/Users/williamcory/voltaire/docs/`

## Content strategy
- Document just enough for user success - not too much, not too little
- Prioritize accuracy and usability over completeness
- Make content evergreen when possible
- Search for existing content before adding anything new - avoid duplication unless strategic
- Check existing patterns for consistency (all primitives now migrated)
- Start by making the smallest reasonable changes
- Assume Ethereum knowledge - don't explain basic concepts
- Use correct terminology (e.g., "keccak256 hash", "secp256k1", "EIP-55 checksummed address")
- Total documentation: 316 pages across primitives, crypto, and precompiles

## mint.json

- Refer to the [Mintlify docs.json schema](https://mintlify.com/docs.json) when building the mint.json file and site navigation
- Complete navigation includes all 23 primitives, 17 crypto modules, and 21 precompiles
- Current scope: FULL (316 pages covering all modules)
- Use nested groups for primitives with multiple pages
- Keep navigation clean and logical

## Frontmatter requirements for pages
- **title**: Clear, descriptive page title
- **description**: Concise summary for SEO/navigation
- No other frontmatter fields required (keep it minimal)

## Writing standards
- **Voice**: Second-person ("you") when addressing user, but prefer technical/declarative tone
- **Style**: Brief, concise, technical - like Vue.js, Stripe, or Ethereum docs
- **Code examples**:
  - Must be complete and runnable (no placeholders)
  - Test before publishing
  - Include both Class API and Namespace API in `<Tabs>` when applicable
  - Use language tags on all code blocks
  - Show TypeScript types explicitly
- **Prerequisites**: List at start of procedural content
- **Formatting**:
  - Use `<Tabs>` and `<Tab>` for multiple code variants
  - Use `<Accordion>` for expandable detailed explanations
  - Use `<Tip>`, `<Warning>`, `<Note>` for callouts
  - Relative paths for internal links (e.g., `/primitives/bytecode/analyze`)
  - Alt text on all images
- **Structure**:
  - H1 auto-generated from title - start content with H2
  - Include basic AND advanced use cases
  - Progressive disclosure (simple → complex)
  - Make content scannable (headings, lists, code blocks)

## Component conversion from Starlight

When converting from Starlight to Mintlify:
- `<Tabs syncKey="X">` → `<Tabs>` (remove syncKey)
- `<TabItem label="X">` → `<Tab title="X">`
- `<Aside type="tip">` → `<Tip>`
- `<Aside type="caution">` → `<Warning>`
- `<Aside type="note">` → `<Note>`
- `<Card>` / `<CardGrid>` → Convert to markdown sections
- `<Steps>` → Convert to numbered markdown headings
- Remove ALL component imports (Mintlify has built-in components)

## Git workflow
- NEVER use --no-verify when committing
- Ask how to handle uncommitted changes before starting
- Create a new branch when no clear branch exists for changes
- Commit frequently throughout development
- NEVER skip or disable pre-commit hooks
- Follow project commit message conventions

## Do not
- Skip frontmatter on any MDX file
- Use absolute URLs for internal links
- Include untested code examples
- Make assumptions - always ask for clarification
- Add emojis unless explicitly requested
- Use excessive praise or validation ("Great!", "Excellent!", etc.)
- Create files unnecessarily - prefer editing existing files
- Use Starlight-specific components or imports in Mintlify docs

## Voltaire-specific patterns

### Branded Types
- All primitives use branded `Uint8Array` types for type safety
- Zero runtime overhead - just TypeScript compile-time checking
- Example: `type BrandedBytecode = Uint8Array & { readonly __tag: "Bytecode" }`

### Dual API
- **Class API**: OOP style, familiar patterns, instance methods
- **Namespace API**: Tree-shakeable, functional style, better for bundle size
- Always document both in synchronized `<Tabs>`

### Naming conventions
- `Type.from(value)` - Universal constructor
- `Type.fromHex(hex)` - From hex string
- `Type.toHex(value)` - To hex string
- `Type.equals(a, b)` - Equality check
- `Type.validate(value)` - Validation

### Cross-references
- Link to EIPs, Yellow Paper, evm.codes when relevant
- Link to related primitives (e.g., Bytecode → Opcode)
- Include GitHub source links with line numbers when helpful

## Current documentation scope (FULL)

Complete documentation structure in Mintlify (316 pages):

**Getting Started** (2 pages)
- introduction.mdx
- getting-started.mdx

**Concepts** (2 pages)
- branded-types.mdx
- data-first.mdx

**Primitives** (215 pages across 23 modules)
- Abi, AccessList, Address, Authorization, Base64, BinaryTree, BloomFilter, Blob, Bytecode, Chain, Denomination, EventLog, FeeMarket, GasConstants, Hardfork, Hash, Hex, Opcode, Rlp, Siwe, State, Transaction, Uint

**Cryptography** (76 pages across 17 modules)
- Bls12381, Bn254, Ed25519, Keccak256, Kzg, P256, Pbkdf2, Poseidon, Ripemd160, Schnorr, Secp256k1, Secp256r1, Sha256, Sha3, Sha512, Signature, X25519

**Precompiles** (21 pages)
- 21 EVM precompile implementations

When adding new docs, follow the established patterns across all existing modules.

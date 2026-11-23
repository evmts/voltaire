# Voltaire Documentation Guidelines

Mintlify v4 documentation site for `@tevm/voltaire` (`docs.json`).

## Voices & Structure (Diátaxis)

Keep the four quadrants distinct:

- **Tutorials (`tutorials/`):** *Head First Design Patterns* style — start with a real engineering scenario and a concrete footgun, build visual intuition with Mermaid diagrams and byte-layout tables, use `<Steps>` with verified checkpoints and `<Accordion>` self-checks.
- **Core Concepts (`concepts/`):** K&R explanation style — concise, authoritative, diagram-first explanations of architecture and trade-offs.
- **Guides & Skills (`guides/`, `skills/`, `examples/`, `contract/`, `jsonrpc-provider/`, `utils/`):** Task-focused recipes and copyable shadcn-style implementations.
- **API Reference (`primitives/`, `crypto/`, `evm/`):** K&R C book style — state what the type is and its byte layout in the first sentence, give exact TypeScript signatures, parameter/error tables, and minimal runnable examples.

## Non-Negotiable Rules

1. **Verify against source:** Every import path and method signature must match `packages/voltaire-ts/package.json` and `packages/voltaire-ts/src/`. Never import from `'tevm'` or `'@voltaire/*'`.
2. **Frontmatter:** Every `.mdx` file requires `title` and `description`. Never duplicate the title as an `# H1` in the body.
3. **No callout stacking:** Never place two or more `<Info>`/`<Tip>`/`<Warning>`/`<Note>` blocks back-to-back at the top of a page.
4. **No 1-tab `<Tabs>`:** Only use `<Tabs>` for 2+ real alternatives.
5. **Mermaid hygiene:** Use `flowchart LR/TD`, `sequenceDiagram`, `stateDiagram-v2`, or `classDiagram`. Quote node labels containing spaces, parentheses, brackets, or colons. Avoid HTML tags inside Mermaid labels.
6. **Zero AI fluff:** Avoid *robust, seamless, powerful, cutting-edge, groundbreaking, leverage, delve, comprehensive, simply, just, easily, obviously*.
7. **Links:** Use root-relative internal paths without `.mdx` (e.g., `/concepts/branded-types`). GitHub links point to `https://github.com/evmts/voltaire/blob/main/packages/voltaire-ts/src/...`.
8. **Navigation:** Every navigable page must exist on disk and be registered in `docs.json`. Add `redirects` in `docs.json` whenever moving or consolidating URLs.

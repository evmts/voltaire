# Voltaire Mythical History

The Mythical History is the clean, tree-equal architectural history of `evmts/voltaire`: small atomic commits grouped under well-scoped epics, docs before code, with zero abandoned dead-ends.

## Files

- [`epics.json`](epics.json): Directed acyclic graph of Voltaire's architectural epics, owning paths, verification targets, and wiki links.
- [`../wiki/pages/mythical-history.md`](../wiki/pages/mythical-history.md): Human-readable narrative published to `https://smithers.sh/evmts/voltaire/-/wiki`.

## Bootstrap & Verification

```sh
# Validate the epic DAG and owning paths
scripts/smthrs ci //.smithers:mythical-check

# Bootstrap or inspect mythical history via Smithers CLI
scripts/smthrs history --help
```

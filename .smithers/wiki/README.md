# Voltaire Engineering Wiki

Obsidian-compatible knowledge base for `evmts/voltaire`, served on Smithers Cloud at `https://smithers.sh/evmts/voltaire/-/wiki` and validated by `scripts/smthrs ci //.smithers:wiki-check`.

## Structure

- Catalog: [`.smithers/coding-project.json`](../coding-project.json)
- Pages: [`.smithers/wiki/pages/`](pages/)
- Feed publisher: [`scripts/publish-feeds.mjs`](../../scripts/publish-feeds.mjs)

Every page carries YAML frontmatter (`title`, `tags`), `[[wikilinks]]` for automatic backlink graphs in Smithers Cloud's Wiki plugin, and explicit `inputs` in `.smithers/coding-project.json` so source changes invalidate stale documentation.

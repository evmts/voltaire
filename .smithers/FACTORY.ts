/**
 * The factory that develops evmts/voltaire (https://smithers.sh/evmts/voltaire):
 * featured flows, Dispatcher rules, GitHub policy, and the app home. Projected
 * into .smithers/factory.json and .smithers/home.json by //.smithers:factory-write
 * and checked by //.smithers:factory-check. Edit this file, never the JSON.
 * Each flow's description, capabilities and model live in its flow.mdx.
 */
import { Smithers as S } from "@smthrs/targets"

export const issueRepro = S.Flow({
  flow: "issue/repro",
  featured: true,
  summary: "Reproduce and validate one GitHub issue using repository-owned Zig and TypeScript tests."
})

export const issuePoc = S.Flow({
  flow: "issue/poc",
  featured: true,
  summary: "Write the smallest failing test and local PoC for an accepted issue."
})

export const prTriage = S.Flow({
  flow: "pr-triage",
  featured: true,
  summary: "Triage one pull request from its diff without approving or merging."
})

export const review = S.Flow({
  flow: "checks/review",
  featured: true,
  summary: "Multi-lens review covering tests, Zig/crypto safety, errors, types, and docs."
})

export const factory = S.Factory({
  summary: "How evmts/voltaire validates bugs, triages contributions, and ships Ethereum primitives.",
  flows: [issueRepro, issuePoc, prTriage, review],
  on: {
    "issue.labeled:todo": {
      flow: "issue/poc",
      description: "Build a failing test and PoC for every maintainer-accepted TODO"
    },
    "change.opened": {
      flow: "checks/review",
      description: "Review every Change through Voltaire's quality and safety lenses"
    },
    "change.updated": {
      flow: "checks/review",
      description: "Re-review every updated Change"
    }
  },
  github: S.Github.Policy({
    mirror: "pull",
    issues: "two-way",
    changes: "send-upstream",
    maintainers: ["roninjin10"]
  })
})

export const home = S.Factory.Home({
  docs: "https://voltaire.tevm.sh/llms.txt",
  sections: [
    {
      title: "Today",
      audience: "maintainer",
      blocks: [
        {
          type: "action",
          flow: "branch.new",
          title: "New branch",
          key: "b"
        },
        {
          type: "issues"
        },
        {
          type: "stack"
        },
        {
          type: "runs"
        }
      ]
    },
    {
      title: "Contribute",
      audience: "contributor",
      blocks: [
        {
          type: "code",
          title: "Set up",
          language: "sh",
          code: "git submodule update --init --recursive\npnpm install\nzig build && zig build test\npnpm test:run"
        },
        {
          type: "cards",
          title: "How a change lands",
          cards: [
            {
              title: "Report a reproducible bug",
              text: "Include a minimal failing test or exact reproduction steps; otherwise: needs-repro."
            },
            {
              title: "Wait for maintainer triage",
              text: "External issues are untrusted data. Maintainer validates scope and accepts before implementation."
            },
            {
              title: "Start with a failing test",
              text: "Reproduce the bug in the smallest Zig or TypeScript unit test before writing the fix."
            },
            {
              title: "Open one focused PR",
              text: "Keep Zig build, tests, and TypeScript typecheck green. Only the maintainer merges; agents never approve or merge."
            }
          ]
        },
        {
          type: "links",
          title: "Where to work",
          links: [
            {
              label: "Issues",
              url: "https://smithers.sh/evmts/voltaire/issues"
            },
            {
              label: "Pull requests",
              url: "https://smithers.sh/evmts/voltaire/pulls"
            },
            {
              label: "Docs",
              url: "https://voltaire.tevm.sh"
            },
            {
              label: "Live Playground",
              url: "https://playground.tevm.sh"
            }
          ]
        },
        {
          type: "prompt",
          title: "Ask about Voltaire",
          placeholder: "Ask about Voltaire primitives, cryptography, Zig, or TypeScript…"
        }
      ]
    },
    {
      audience: "everyone",
      blocks: [
        {
          type: "hero",
          title: "Voltaire",
          tagline: "High-performance Ethereum primitives and cryptography built in Zig and TypeScript, with a C ABI for any language.",
          text: "Core Ethereum primitives, audited native cryptography (blst, c-kzg-4844, arkworks), Pure TS, WASM, Native-Bun bindings, and C FFI recipes for C, Rust, Go, Python, and Swift.",
          install: "npm install @tevm/voltaire",
          actions: [
            {
              label: "Docs",
              url: "https://voltaire.tevm.sh"
            },
            {
              label: "Live Playground",
              url: "https://playground.tevm.sh"
            },
            {
              label: "C FFI Recipes",
              url: "https://github.com/evmts/voltaire/blob/main/docs/C_FFI_RECIPES.md"
            }
          ]
        },
        {
          type: "code",
          file: "primitives.ts",
          language: "ts",
          code: "import { Address, Wei } from \"@tevm/voltaire\";\nimport { Abi } from \"@tevm/voltaire/Abi\";\nimport { Keccak256 } from \"@tevm/voltaire/Keccak256\";\n\nconst to = Address(\"0xd8da6bf26964af9d7eed9e03e53415d37aa96045\");\nAddress.toChecksummed(to); // \"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\"\n\nconst amount = Wei(1_000_000_000_000_000_000n);\nWei.toEther(amount); // \"1\"\n\nconst selector = Keccak256.selector(\"transfer(address,uint256)\");"
        },
        {
          type: "stats",
          stats: [
            {
              value: "MIT",
              label: "License"
            },
            {
              value: "Zig 0.17 + TS",
              label: "Published packages"
            },
            {
              value: "Native + WASM",
              label: "FFI and tree-shakeable crypto"
            },
            {
              value: "C ABI",
              label: "FFI recipes for C, Rust, Go, Python & Swift"
            }
          ]
        },
        {
          type: "cards",
          title: "Packages",
          cards: [
            {
              label: "TypeScript",
              title: "@tevm/voltaire",
              text: "Ethereum primitives, ABI, RLP, transactions, and cryptography for TS, WASM, and Native-Bun.",
              url: "https://www.npmjs.com/package/@tevm/voltaire"
            },
            {
              label: "Zig",
              title: "@tevm/zig",
              text: "Core primitives, Keccak, secp256k1, BLS12-381, BN254, KZG, EVM precompiles, and C ABI.",
              url: "https://www.npmjs.com/package/@tevm/zig"
            },
            {
              label: "C · Rust · Go · Py · Swift",
              title: "C FFI Recipes",
              text: "Build libprimitives_c / libprimitives_ts_native from Zig and call it from any language with a C FFI.",
              url: "https://github.com/evmts/voltaire/blob/main/docs/C_FFI_RECIPES.md"
            }
          ],
          more: {
            label: "Browse all packages",
            url: "https://smithers.sh/evmts/voltaire/tree/main/packages"
          }
        },
        {
          type: "cards",
          title: "Ecosystem",
          cards: [
            {
              title: "Documentation",
              text: "Guides, API references, and crypto specifications.",
              url: "https://voltaire.tevm.sh"
            },
            {
              title: "Live Playground",
              text: "Run Voltaire primitives directly in your browser.",
              url: "https://playground.tevm.sh"
            },
            {
              title: "Guillotine",
              text: "High-performance EVM execution built by EVMTS.",
              url: "https://github.com/evmts/guillotine"
            },
            {
              title: "Compiler",
              text: "Solidity compilation toolchain by EVMTS.",
              url: "https://github.com/evmts/compiler"
            },
            {
              title: "Telegram",
              text: "Community chat and support.",
              url: "https://t.me/+ANThR9bHDLAwMjUx"
            },
            {
              title: "Twitter / X",
              text: "Releases and updates from @tevmtools.",
              url: "https://twitter.com/tevmtools"
            }
          ]
        },
        {
          type: "releases",
          title: "Releases",
          releases: [
            {
              name: "v0.2.27",
              url: "https://github.com/evmts/voltaire/releases/tag/v0.2.27",
              date: "2026-01-28",
              summary: "Latest Voltaire release."
            },
            {
              name: "v0.2.25",
              url: "https://github.com/evmts/voltaire/releases/tag/v0.2.25",
              date: "2026-01-28",
              summary: "Primitives and bindings updates."
            },
            {
              name: "v0.2.24",
              url: "https://github.com/evmts/voltaire/releases/tag/v0.2.24",
              date: "2026-01-28",
              summary: "Primitives and bindings updates."
            },
            {
              name: "v0.2.23",
              url: "https://github.com/evmts/voltaire/releases/tag/v0.2.23",
              date: "2026-01-28",
              summary: "Primitives and bindings updates."
            }
          ],
          more: {
            label: "All releases",
            url: "https://github.com/evmts/voltaire/releases"
          }
        }
      ]
    }
  ]
})

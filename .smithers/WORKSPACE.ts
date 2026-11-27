import { Smithers as S } from "@smthrs/targets"

// Smithers 1.0 workspace for evmts/voltaire (https://smithers.sh/evmts/voltaire).
//
// Every tool a target spawns is a declared host binary, so its bytes enter the
// cache key of each target that names it: upgrading Zig, Rust, Node, pnpm, or
// Bun re-keys only the targets that run it.
//
// Shared Smithers Cloud object store (https://build.smithers.sh):
// - Split read/write credentials enforce our trust boundary:
//   * Untrusted / external contributor runs may read cached results via
//     SMITHERS_CACHE_READ_TOKEN, but never hold SMITHERS_CACHE_WRITE_TOKEN and
//     therefore cannot poison the shared object store or bypass gates.
//   * Trusted executions (Smithers Cloud controlled sandboxes and maintainer
//     runs) populate the shared cache via SMITHERS_CACHE_WRITE_TOKEN.
export const Workspace = S.Workspace("evmts-voltaire", {
  repository: "evmts/voltaire",
  cache: S.Cache({
    directory: ".smithers/cache",
    hostDirectories: [".zig-cache", "zig-out", "target", "node_modules"],
    remote: S.RemoteCache.make({
      endpoint: "https://build.smithers.sh",
      read: S.Secret("SMITHERS_CACHE_READ_TOKEN"),
      write: S.Secret("SMITHERS_CACHE_WRITE_TOKEN")
    })
  }),
  toolchains: [
    S.Rust.Toolchain({
      workspace: S.file("//Cargo.toml"),
      channel: "stable",
      lockfile: S.file("//Cargo.lock")
    })
  ],
  host: S.Host({ bins: ["zig", "cargo", "rustc", "cc", "node", "pnpm", "bun", "sh"] }),
  discovery: {
    prune: [
      ".zig-cache",
      "zig-out",
      "target",
      "node_modules",
      ".flows",
      ".uphill",
      "worktrees",
      ".smithers/cache",
      ".smithers/reports",
      ".smithers/node_modules",
      "packages/voltaire-ts/dist",
      "packages/voltaire-ts/types",
      "apps/playground/dist",
      "vendor",
      "skills"
    ]
  }
})

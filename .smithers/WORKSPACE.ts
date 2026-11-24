// Current smthrs discovers this file; WORKSPACE.smithers is a compatibility entry.
import { Smithers as S } from "@smthrs/targets"

// Every tool a target spawns is a declared host binary, so its bytes enter the
// key of each target that names it: a new Zig, Node or pnpm install re-keys
// exactly the targets that run it.
export const Workspace = S.Workspace("evmts-voltaire", {
  repository: "evmts/voltaire",
  cache: S.Cache({
    directory: ".smithers/cache",
    hostDirectories: [".zig-cache", "zig-out", "target", "node_modules"],
    // Local-first cache that syncs through Cloudflare when tokens are present
    // in the local environment or GitHub Actions CI.
    remote: S.RemoteCache.make({
      endpoint: "https://build.smithers.sh",
      read: S.Secret("SMITHERS_CACHE_READ_TOKEN"),
      write: S.Secret("SMITHERS_CACHE_WRITE_TOKEN")
    })
  }),
  toolchains: [S.Rust.Toolchain({ workspace: S.file("//Cargo.toml"), channel: "stable", lockfile: S.file("//Cargo.lock") })],
  host: S.Host({ bins: ["zig", "cargo", "rustc", "cc", "node", "pnpm", "sh"] }),
  discovery: {
    prune: [
      ".zig-cache",
      "zig-out",
      "target",
      "node_modules",
      ".flows",
      ".smithers/cache",
      ".smithers/reports",
      "packages/voltaire-ts/dist",
      "packages/voltaire-ts/types",
      "packages/voltaire-effect/dist",
      "vendor",
      "skills"
    ]
  }
})

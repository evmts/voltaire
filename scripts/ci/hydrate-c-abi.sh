#!/usr/bin/env bash
set -euo pipefail

# Smithers supplies a detached Git checkout. Read its recorded gitlinks with the
# Jujutsu shipped in the sandbox. Only these two public dependencies are needed.
if [[ ! -d .jj ]]; then
  [[ -e .git ]] || { echo 'C ABI requires a repository checkout' >&2; exit 1; }
  jj --quiet git init --colocate .
fi

hydrate() (
  parent=$1 path=$2 url=$3
  target="$parent/$path"
  entry=$(cd "$parent" && jj --ignore-working-copy debug tree -r '@-' "root:$path")
  gitlink='^Ok\(Resolved\(Some\(GitSubmodule\(CommitId\("([0-9a-f]{40})"\)\)\)\)\)$'
  if [[ ! ${entry#"$path: "} =~ $gitlink ]]; then
    echo "Expected a committed gitlink at $target" >&2
    exit 1
  fi
  pin=${BASH_REMATCH[1]}
  if [[ -L $target ]]; then echo "Expected a directory at $target" >&2; exit 1; fi
  if [[ ! -d $target/.jj ]]; then
    if [[ -e $target/.git ]]; then
      jj --quiet git init --colocate "$target"
    else
      # Leave an incomplete fetch outside the destination so a retry can resume.
      staging=$(mktemp -d "$(dirname "$target")/.c-abi.XXXXXXXX")
      trap 'rm -rf -- "$staging"' EXIT
      jj --quiet git clone --no-colocate "$url" "$staging/checkout"
      jj --quiet -R "$staging/checkout" new "$pin"
      mv -T "$staging/checkout" "$target"
    fi
  fi
  actual=$(jj -R "$target" log -r '@-' --no-graph -T commit_id)
  changes=$(jj -R "$target" diff --name-only)
  if [[ $actual != "$pin" || -n $changes ]]; then
    echo "Expected a clean $target at $pin" >&2
    exit 1
  fi
  printf '%s %s\n' "$target" "$pin"
)

wally=packages/voltaire-zig/lib/libwally-core
hydrate . "$wally" https://github.com/evmts/libwally-core.git
hydrate "$wally" src/secp256k1 https://github.com/BlockstreamResearch/secp256k1-zkp.git

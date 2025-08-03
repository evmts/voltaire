
zig build build-evm-runner -Doptimize=ReleaseFast \
  && zig build build-orchestrator -Doptimize=ReleaseFast \
  && ./zig-out/bin/orchestrator --compare --export markdown --num-runs 1 --js-runs 1 --internal-runs 10 --js-internal-runs 1

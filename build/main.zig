const std = @import("std");

// Build configuration and options
pub const Config = @import("config.zig");

// Module definitions - now in src/
pub const Modules = @import("../src/modules.build.zig");

// Executables - now colocated with their source
pub const GuillotineExe = @import("../src/build.zig");
pub const DevtoolExe = @import("../apps/devtool/build.zig");
pub const CliExe = @import("../apps/cli/build.zig");
pub const EvmRunnerExe = @import("executables/evm_runner.zig"); // TODO: move this
pub const BenchmarksExe = @import("executables/benchmarks.zig"); // TODO: move this

// Libraries - now aggregated in lib/build.zig
const lib_build = @import("../lib/build.zig");
pub const BlstLib = lib_build.BlstLib;
pub const CKzgLib = lib_build.CKzgLib;
pub const Bn254Lib = lib_build.Bn254Lib;
pub const FoundryLib = lib_build.FoundryLib;

// Language bindings - now in SDK directories
pub const WasmBindings = @import("../sdks/wasm/build.zig");
pub const PythonBindings = @import("../sdks/python/build.zig");
pub const SwiftBindings = @import("../sdks/swift/build.zig");
pub const GoBindings = @import("../sdks/go/build.zig");
pub const TypeScriptBindings = @import("../sdks/typescript/build.zig");
pub const BunBindings = @import("../sdks/bun/build.zig");

// Build steps
pub const RustBuild = @import("steps/rust_build.zig"); // TODO: move to lib/
pub const AssetGenerator = DevtoolExe.AssetGenerator; // Now exported from devtool
pub const Tests = @import("../test/build.zig"); // Moved to test directory

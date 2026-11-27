const std = @import("std");

pub fn createCKzgLibrary(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    blst_lib: *std.Build.Step.Compile,
) *std.Build.Step.Compile {
    const is_wasm = target.result.cpu.arch == .wasm32 or target.result.cpu.arch == .wasm64;

    // Build c-kzg-4844 from source
    const lib = b.addLibrary(.{
        .name = "c-kzg-4844",
        .linkage = .static,
        .use_llvm = true, // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
            .single_threaded = if (is_wasm) true else null,
            .strip = if (is_wasm) true else null,
        }),
    });

    lib.root_module.link_libc = true;
    lib.root_module.linkLibrary(blst_lib);

    const c_flags: []const []const u8 = if (is_wasm)
        &.{ "-std=c99", "-Oz", "-ffunction-sections", "-fdata-sections", "-fno-sanitize=undefined" }
    else
        &.{ "-std=c99", "-fPIC", "-fno-sanitize=undefined" };

    // -fPIC required for shared libraries on Linux (ignored on Windows/macOS)
    lib.root_module.addCSourceFiles(.{
        .files = &.{
            "packages/voltaire-zig/lib/c-kzg-4844/src/ckzg.c",
        },
        .flags = c_flags,
    });

    lib.root_module.addIncludePath(b.path("packages/voltaire-zig/lib/c-kzg-4844/src"));
    lib.root_module.addIncludePath(b.path("packages/voltaire-zig/lib/c-kzg-4844/blst/bindings"));

    return lib;
}

const std = @import("std");

pub fn createCKzgLibrary(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    blst_lib: *std.Build.Step.Compile,
) *std.Build.Step.Compile {
    // Build c-kzg-4844 from source
    const lib = b.addLibrary(.{
        .name = "c-kzg-4844",
        .linkage = .static,
        .use_llvm = true, // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
        }),
    });

    lib.linkLibC();
    lib.linkLibrary(blst_lib);

    // -fPIC required for shared libraries on Linux (ignored on Windows/macOS)
    lib.addCSourceFiles(.{
        .files = &.{
            "packages/voltaire-zig/lib/c-kzg-4844/src/ckzg.c",
        },
        .flags = &.{ "-std=c99", "-fPIC", "-fno-sanitize=undefined" },
    });

    lib.addIncludePath(b.path("packages/voltaire-zig/lib/c-kzg-4844/src"));
    lib.addIncludePath(b.path("packages/voltaire-zig/lib/c-kzg-4844/blst/bindings"));

    return lib;
}

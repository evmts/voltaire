const std = @import("std");
const Modules = @import("../modules.zig");

pub fn createIntegrationTests(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    modules: Modules.ModuleSet,
    revm_lib: ?*std.Build.Step.Compile,
    bn254_lib: ?*std.Build.Step.Compile,
    c_kzg_lib: *std.Build.Step.Compile,
    blst_lib: *std.Build.Step.Compile,
    rust_target: ?[]const u8,
) *std.Build.Step.Compile {
    const integration_tests = b.addTest(.{
        .name = "integration-tests",
        .root_module = b.createModule(.{
            .root_source_file = b.path("test/root.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });
    
    // Add all necessary imports to integration tests
    integration_tests.root_module.addImport("evm", modules.evm_mod);
    integration_tests.root_module.addImport("primitives", modules.primitives_mod);
    integration_tests.root_module.addImport("crypto", modules.crypto_mod);
    integration_tests.root_module.addImport("compilers", modules.compilers_mod);
    integration_tests.root_module.addImport("provider", modules.provider_mod);
    integration_tests.root_module.addImport("trie", modules.trie_mod);
    integration_tests.root_module.addImport("Guillotine_lib", modules.lib_mod);
    
    if (modules.revm_mod) |revm_mod| {
        integration_tests.root_module.addImport("revm", revm_mod);
        if (revm_lib) |revm| {
            integration_tests.linkLibrary(revm);
            integration_tests.addIncludePath(b.path("lib/revm"));
            integration_tests.linkLibC();
            
            const revm_rust_target_dir_test = if (optimize == .Debug) "debug" else "release";
            const revm_dylib_path_test = if (rust_target) |target_triple|
                b.fmt("target/{s}/{s}/librevm_wrapper.dylib", .{ target_triple, revm_rust_target_dir_test })
            else
                b.fmt("target/{s}/librevm_wrapper.dylib", .{revm_rust_target_dir_test});
            integration_tests.addObjectFile(b.path(revm_dylib_path_test));
            
            if (target.result.os.tag == .linux) {
                integration_tests.linkSystemLibrary("m");
                integration_tests.linkSystemLibrary("pthread");
                integration_tests.linkSystemLibrary("dl");
            } else if (target.result.os.tag == .macos) {
                integration_tests.linkSystemLibrary("c++");
                integration_tests.linkFramework("Security");
                integration_tests.linkFramework("SystemConfiguration");
                integration_tests.linkFramework("CoreFoundation");
            }
            
            integration_tests.step.dependOn(&revm.step);
        }
    }
    
    if (bn254_lib) |bn254| {
        integration_tests.linkLibrary(bn254);
        integration_tests.addIncludePath(b.path("lib/ark"));
    }
    
    integration_tests.linkLibrary(c_kzg_lib);
    integration_tests.linkLibrary(blst_lib);
    
    return integration_tests;
}
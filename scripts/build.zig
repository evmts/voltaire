const std = @import("std");

pub fn createAnalyzerTools(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    modules: anytype,
) void {
    createPatternAnalyzer(b, target, optimize, modules);
    createBytecodePatternAnalyzer(b, target, optimize, modules);
}

fn createPatternAnalyzer(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    modules: anytype,
) void {
    const pattern_analyzer = b.addExecutable(.{
        .name = "pattern-analyzer",
        .root_module = b.createModule(.{
            .root_source_file = b.path("scripts/analyze_patterns.zig"),
            .target = target,
            .optimize = optimize,
        }),
        .use_llvm = true,
    });

    pattern_analyzer.root_module.addImport("evm", modules.evm_mod);
    pattern_analyzer.root_module.addImport("primitives", modules.primitives_mod);
    pattern_analyzer.root_module.addImport("crypto", modules.crypto_mod);
    b.installArtifact(pattern_analyzer);

    const pattern_analyzer_step = b.step("build-pattern-analyzer", "Build JSON fixture pattern analyzer");
    pattern_analyzer_step.dependOn(&b.addInstallArtifact(pattern_analyzer, .{}).step);
}

fn createBytecodePatternAnalyzer(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    modules: anytype,
) void {
    const bytecode_patterns = b.addExecutable(.{
        .name = "bytecode-patterns",
        .root_module = b.createModule(.{
            .root_source_file = b.path("scripts/bytecode_patterns.zig"),
            .target = target,
            .optimize = optimize,
        }),
        .use_llvm = true,
    });

    bytecode_patterns.root_module.addImport("evm", modules.evm_mod);
    bytecode_patterns.root_module.addImport("primitives", modules.primitives_mod);
    bytecode_patterns.root_module.addImport("crypto", modules.crypto_mod);
    b.installArtifact(bytecode_patterns);

    const bytecode_patterns_step = b.step("build-bytecode-patterns", "Build bytecode pattern analyzer");
    bytecode_patterns_step.dependOn(&b.addInstallArtifact(bytecode_patterns, .{}).step);
}
const std = @import("std");

pub fn createFixturesModule(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    compilers_mod: *std.Build.Module,
    foundry_lib: ?*std.Build.Step.Compile,
) *std.Build.Module {
    _ = target;
    _ = optimize;
    
    const fixtures_mod = b.createModule(.{
        .root_source_file = b.path("data/fixtures/fixtures.zig"),
    });
    
    // Add foundry compilers as dependency
    fixtures_mod.addImport("foundry_compilers", compilers_mod);
    
    // Link with foundry library if available
    if (foundry_lib) |lib| {
        fixtures_mod.linkLibrary(lib);
        fixtures_mod.addIncludePath(b.path("lib/foundry-compilers"));
    }
    
    return fixtures_mod;
}
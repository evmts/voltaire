const std = @import("std");

pub fn createSwiftSteps(b: *std.Build) void {
    const swift_build_cmd = b.addSystemCommand(&[_][]const u8{ "swift", "build" });
    swift_build_cmd.setCwd(b.path("src/guillotine-swift"));
    swift_build_cmd.step.dependOn(b.getInstallStep());

    const swift_build_step = b.step("swift", "Build Swift bindings");
    swift_build_step.dependOn(&swift_build_cmd.step);

    const swift_test_cmd = b.addSystemCommand(&[_][]const u8{ "swift", "test" });
    swift_test_cmd.setCwd(b.path("src/guillotine-swift"));
    swift_test_cmd.step.dependOn(&swift_build_cmd.step);

    const swift_test_step = b.step("swift-test", "Run Swift binding tests");
    swift_test_step.dependOn(&swift_test_cmd.step);

    const swift_validate_cmd = b.addSystemCommand(&[_][]const u8{ "swift", "package", "validate" });
    swift_validate_cmd.setCwd(b.path("src/guillotine-swift"));

    const swift_validate_step = b.step("swift-validate", "Validate Swift package");
    swift_validate_step.dependOn(&swift_validate_cmd.step);
}
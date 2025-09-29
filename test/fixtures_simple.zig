const std = @import("std");
const fixtures = @import("fixtures");
const testing = std.testing;

test "compile all fixtures" {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Initialize and compile all fixtures
    var fx = try fixtures.Fixtures.init(allocator);
    defer fx.deinit();
    
    try fx.compileAll();
    
    // List what we compiled
    fx.listFixtures();
    
    // Verify we compiled some contracts
    try testing.expect(fx.contracts.count() > 0);
    
    // Check specific fixtures exist
    try testing.expect(fx.getDeployedBytecode("arithmetic") != null);
    try testing.expect(fx.getDeployedBytecode("storage") != null);
    try testing.expect(fx.getDeployedBytecode("hashing") != null);
    
    std.debug.print("\nSuccessfully compiled {} fixtures\n", .{fx.contracts.count()});
}
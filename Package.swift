// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "EthereumPrimitives",
    platforms: [
        .macOS(.v10_15),
        .iOS(.v13),
        .tvOS(.v13),
        .watchOS(.v6),
        .macCatalyst(.v13),
        .visionOS(.v1)
    ],
    products: [
        // Main library product
        .library(
            name: "EthereumPrimitives",
            targets: ["EthereumPrimitives"]
        ),
    ],
    dependencies: [
        // BigInt for uint256 operations
        .package(url: "https://github.com/attaswift/BigInt.git", from: "5.3.0"),
    ],
    targets: [
        // C library wrapper (requires running `zig build` first)
        .systemLibrary(
            name: "CPrimitives",
            path: "src/swift/CPrimitives"
        ),

        // Main Swift library
        // Swift files are colocated with .zig and .ts files in src/
        // SPM will auto-discover .swift files and ignore non-Swift files
        .target(
            name: "EthereumPrimitives",
            dependencies: [
                "CPrimitives",
                .product(name: "BigInt", package: "BigInt"),
            ],
            path: "src",
            exclude: [
                // Exclude non-Swift build artifacts and directories
                "precompiles/",
                "root.zig",
                "c_api.zig",
                "swift/CPrimitives",  // C bridge module
                // Exclude Node.js and TypeScript ecosystem
                "node_modules/",
                "tsconfig.json",
                "ethereum-types/",
                // Exclude Zig-specific directories
                "crypto/bn254/",
                "crypto/signers/",
            ],
            linkerSettings: [
                // Link against the Zig-built C library
                .unsafeFlags(["-L", "zig-out/lib"]),
                .linkedLibrary("primitives_c"),
                .linkedLibrary("c-kzg-4844"),
                .linkedLibrary("blst"),
            ]
        ),

        // Test target
        .testTarget(
            name: "EthereumPrimitivesTests",
            dependencies: ["EthereumPrimitives"],
            path: "Tests"
        ),
    ]
)

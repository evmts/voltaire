// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "GuillotineEVM",
    platforms: [
        .macOS(.v13),
        .iOS(.v16),
        .watchOS(.v9),
        .tvOS(.v16)
    ],
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "GuillotineEVM",
            targets: ["GuillotineEVM"]
        ),
        .library(
            name: "GuillotinePrimitives",
            targets: ["GuillotinePrimitives"]
        ),
        .library(
            name: "GuillotineCompilers",
            targets: ["GuillotineCompilers"]
        ),
        .executable(
            name: "BasicTest",
            targets: ["BasicTest"]
        )
    ],
    dependencies: [
        // Dependencies declare other packages that this package depends on.
    ],
    targets: [
        // Core EVM execution engine
        .target(
            name: "GuillotineEVM",
            dependencies: [
                "GuillotinePrimitives",
                "GuillotineC"
            ],
            path: "Sources/GuillotineEVM",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        ),
        
        // Ethereum primitives
        .target(
            name: "GuillotinePrimitives",
            dependencies: ["GuillotineC"],
            path: "Sources/GuillotinePrimitives",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        ),
        
        // Compiler utilities
        .target(
            name: "GuillotineCompilers",
            dependencies: [
                "GuillotinePrimitives",
                "GuillotineC"
            ],
            path: "Sources/GuillotineCompilers",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        ),
        
        // C interop layer
        .target(
            name: "GuillotineC",
            path: "Sources/GuillotineC",
            publicHeadersPath: "include",
            cSettings: [
                .headerSearchPath("include"),
                .define("SWIFT_PACKAGE")
            ],
            linkerSettings: [
                .linkedLibrary("Guillotine", .when(platforms: [.macOS, .iOS, .watchOS, .tvOS])),
                .unsafeFlags(["-L../../zig-out/lib"], .when(platforms: [.macOS])),
                .unsafeFlags(["-Xlinker", "-rpath", "-Xlinker", "@loader_path/../../zig-out/lib"], .when(platforms: [.macOS]))
            ]
        ),
        
        // Basic test executable
        .executableTarget(
            name: "BasicTest",
            dependencies: [
                "GuillotineC",
                "GuillotinePrimitives"
                // Remove GuillotineEVM to test if async main works
            ],
            path: "Sources/BasicTest",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        ),
        
        // Tests
        .testTarget(
            name: "GuillotineEVMTests",
            dependencies: [
                "GuillotineEVM",
                "GuillotinePrimitives",
                "GuillotineCompilers"
            ],
            path: "Tests/GuillotineEVMTests",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        ),
        
        .testTarget(
            name: "GuillotinePrimitivesTests",
            dependencies: ["GuillotinePrimitives"],
            path: "Tests/GuillotinePrimitivesTests",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        ),
        
        .testTarget(
            name: "GuillotineCompilersTests",
            dependencies: ["GuillotineCompilers"],
            path: "Tests/GuillotineCompilersTests",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ],
    swiftLanguageVersions: [.v5]
)
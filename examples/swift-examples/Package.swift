// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "SwiftExamples",
    platforms: [
        .macOS(.v12),
        .iOS(.v15),
    ],
    products: [
        .executable(name: "SwiftExamples", targets: ["SwiftExamples"]),
    ],
    dependencies: [
        // Use the Voltaire Swift package from the repo (identity becomes 'swift' due to folder name)
        .package(path: "../../swift"),
    ],
    targets: [
        .executableTarget(
            name: "SwiftExamples",
            dependencies: [
                .product(name: "Voltaire", package: "swift"),
            ]
        ),
    ]
)


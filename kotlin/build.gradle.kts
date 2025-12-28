plugins {
    kotlin("jvm") version "1.9.22"
    `java-library`
}

group = "com.voltaire"
version = "0.1.0"

repositories {
    mavenCentral()
}

val zigOutNative = "${projectDir}/../zig-out/native"

dependencies {
    implementation("net.java.dev.jna:jna:5.14.0")
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.2")
}

tasks.test {
    useJUnitPlatform()
    systemProperty("jna.library.path", zigOutNative)
    environment("LD_LIBRARY_PATH", zigOutNative)
    environment("DYLD_LIBRARY_PATH", zigOutNative)
}

kotlin {
    jvmToolchain(17)
}

tasks.register("checkNativeLib") {
    doLast {
        val libName = when {
            System.getProperty("os.name").lowercase().contains("mac") -> "libprimitives_ts_native.dylib"
            System.getProperty("os.name").lowercase().contains("win") -> "primitives_ts_native.dll"
            else -> "libprimitives_ts_native.so"
        }
        val libFile = file("$zigOutNative/$libName")
        if (!libFile.exists()) {
            throw GradleException("Native library not found: $libFile\nRun 'zig build build-ts-native' first.")
        }
    }
}

tasks.test { dependsOn("checkNativeLib") }

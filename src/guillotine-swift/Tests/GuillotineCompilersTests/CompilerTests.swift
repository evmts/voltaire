import XCTest
@testable import GuillotineCompilers

final class CompilerTests: XCTestCase {
    
    func testSolidityCompilerNotImplemented() {
        XCTAssertThrowsError(try SolidityCompiler.compile("contract Test {}")) { error in
            guard case CompilerError.notImplemented = error else {
                XCTFail("Expected notImplemented error")
                return
            }
        }
    }
    
    func testVyperCompilerNotImplemented() {
        XCTAssertThrowsError(try VyperCompiler.compile("# Vyper contract")) { error in
            guard case CompilerError.notImplemented = error else {
                XCTFail("Expected notImplemented error")
                return
            }
        }
    }
    
    func testCompileResult() {
        let bytecode = Bytes([0x60, 0x80, 0x60, 0x40])
        let abi = """
        [{"type": "constructor", "inputs": []}]
        """
        
        let result = CompileResult(bytecode: bytecode, abi: abi)
        
        XCTAssertEqual(result.bytecode, bytecode)
        XCTAssertEqual(result.abi, abi)
        XCTAssertNil(result.sourceMap)
    }
}
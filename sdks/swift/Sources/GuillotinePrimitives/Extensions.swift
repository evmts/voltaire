import Foundation

// MARK: - Data Extensions
extension Data {
    /// Create Data from hex string
    init?(hexString: String) {
        let len = hexString.count
        guard len % 2 == 0 else { return nil }
        
        var data = Data(capacity: len / 2)
        var index = hexString.startIndex
        
        for _ in 0..<(len / 2) {
            let nextIndex = hexString.index(index, offsetBy: 2)
            let byteString = String(hexString[index..<nextIndex])
            
            guard let byte = UInt8(byteString, radix: 16) else {
                return nil
            }
            
            data.append(byte)
            index = nextIndex
        }
        
        self = data
    }
}
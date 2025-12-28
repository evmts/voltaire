package com.voltaire

import java.nio.charset.StandardCharsets

/** Hex encoding/decoding utilities */
object Hex {
    /** Decode hex string to bytes */
    @JvmStatic
    @Throws(VoltaireError::class)
    fun decode(hex: String): ByteArray {
        val maxLen = hex.length / 2 + 1
        val buf = ByteArray(maxLen)
        val result = VoltaireLib.INSTANCE.primitives_hex_to_bytes(hex, buf, maxLen.toLong())
        if (result < 0) throw VoltaireError.fromCode(result)
        return buf.copyOf(result)
    }

    /** Encode bytes to hex string with 0x prefix */
    @JvmStatic
    fun encode(data: ByteArray): String {
        val bufLen = data.size * 2 + 3
        val buf = ByteArray(bufLen)
        val result = VoltaireLib.INSTANCE.primitives_bytes_to_hex(data, data.size.toLong(), buf, bufLen.toLong())
        require(result >= 0) { "primitives_bytes_to_hex failed: $result" }
        return String(buf, 0, result, StandardCharsets.UTF_8)
    }
}

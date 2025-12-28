package com.voltaire

import java.nio.charset.StandardCharsets

/** 32-byte hash value (Keccak-256, etc.) */
class Hash internal constructor(internal val raw: PrimitivesHash) {

    companion object {
        /** Zero hash */
        @JvmStatic
        val ZERO: Hash = Hash(PrimitivesHash())

        /** Create from hex string (with or without 0x prefix) */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromHex(hex: String): Hash {
            val hash = PrimitivesHash()
            checkResult(VoltaireLib.INSTANCE.primitives_hash_from_hex(hex, hash))
            return Hash(hash)
        }

        /** Create from raw bytes */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromBytes(bytes: ByteArray): Hash {
            if (bytes.size != 32) throw VoltaireError.InvalidLength
            val hash = PrimitivesHash()
            System.arraycopy(bytes, 0, hash.bytes, 0, 32)
            return Hash(hash)
        }
    }

    /** Hex string with 0x prefix */
    val hex: String
        get() {
            val buf = ByteArray(67)
            val rc = VoltaireLib.INSTANCE.primitives_hash_to_hex(raw, buf)
            require(rc >= 0) { "primitives_hash_to_hex failed: $rc" }
            return String(buf, 0, 66, StandardCharsets.UTF_8)
        }

    /** Raw bytes */
    val bytes: ByteArray
        get() = raw.bytes.copyOf()

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Hash) return false
        return VoltaireLib.INSTANCE.primitives_hash_equals(raw, other.raw) != 0.toByte()
    }

    override fun hashCode(): Int = raw.bytes.contentHashCode()

    override fun toString(): String = hex
}

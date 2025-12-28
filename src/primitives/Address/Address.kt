package com.voltaire

/** Ethereum address (20 bytes) */
class Address private constructor(private val raw: PrimitivesAddress) {

    companion object {
        /** Zero address (0x0000...0000) */
        @JvmStatic
        val ZERO: Address = Address(PrimitivesAddress())

        /** Create from hex string (with or without 0x prefix) */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromHex(hex: String): Address {
            val addr = PrimitivesAddress()
            checkResult(VoltaireLib.INSTANCE.primitives_address_from_hex(hex, addr))
            return Address(addr)
        }

        /** Create from raw bytes */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromBytes(bytes: ByteArray): Address {
            if (bytes.size != 20) throw VoltaireError.InvalidLength
            val addr = PrimitivesAddress()
            System.arraycopy(bytes, 0, addr.bytes, 0, 20)
            return Address(addr)
        }

        /** Validate hex string */
        @JvmStatic
        fun isValid(hex: String): Boolean {
            val tmp = PrimitivesAddress()
            return VoltaireLib.INSTANCE.primitives_address_from_hex(hex, tmp) == 0
        }

        /** Validate EIP-55 checksum */
        @JvmStatic
        fun isValidChecksum(hex: String): Boolean =
            VoltaireLib.INSTANCE.primitives_address_validate_checksum(hex) != 0.toByte()

        /** Create from checksummed hex (throws if invalid checksum) */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromChecksummedHex(hex: String): Address {
            if (!isValidChecksum(hex)) throw VoltaireError.InvalidChecksum
            return fromHex(hex)
        }

        /** Calculate CREATE contract address */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun calculateCreate(sender: Address, nonce: Long): Address {
            val out = PrimitivesAddress()
            checkResult(VoltaireLib.INSTANCE.primitives_calculate_create_address(sender.raw, nonce, out))
            return Address(out)
        }

        /** Calculate CREATE2 contract address */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun calculateCreate2(sender: Address, salt: Bytes32, initCode: ByteArray): Address {
            val out = PrimitivesAddress()
            checkResult(VoltaireLib.INSTANCE.primitives_calculate_create2_address(
                sender.raw, salt.bytes, initCode, initCode.size.toLong(), out
            ))
            return Address(out)
        }
    }

    /** Lowercase hex string with 0x prefix */
    val hex: String
        get() {
            val buf = ByteArray(43)
            VoltaireLib.INSTANCE.primitives_address_to_hex(raw, buf)
            return String(buf, 0, 42)
        }

    /** Checksummed hex string (EIP-55) */
    val checksumHex: String
        get() {
            val buf = ByteArray(43)
            VoltaireLib.INSTANCE.primitives_address_to_checksum_hex(raw, buf)
            return String(buf, 0, 42)
        }

    /** Raw bytes */
    val bytes: ByteArray
        get() = raw.bytes.copyOf()

    /** Check if zero address */
    val isZero: Boolean
        get() = VoltaireLib.INSTANCE.primitives_address_is_zero(raw) != 0.toByte()

    /** Short hex (0x1234...abcd) */
    val shortHex: String
        get() {
            val h = hex
            return if (h.length == 42) "${h.substring(0, 8)}...${h.substring(39)}" else h
        }

    /** 32-byte ABI-encoded representation */
    val abiEncoded: ByteArray
        get() {
            val out = ByteArray(32)
            System.arraycopy(raw.bytes, 0, out, 12, 20)
            return out
        }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Address) return false
        return VoltaireLib.INSTANCE.primitives_address_equals(raw, other.raw) != 0.toByte()
    }

    override fun hashCode(): Int = raw.bytes.contentHashCode()

    override fun toString(): String = checksumHex
}

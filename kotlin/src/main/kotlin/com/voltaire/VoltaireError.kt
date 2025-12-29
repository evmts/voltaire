package com.voltaire

/** Errors thrown by Voltaire operations */
sealed class VoltaireError(message: String) : Exception(message) {
    object InvalidHex : VoltaireError("Invalid hex string")
    object InvalidLength : VoltaireError("Invalid length")
    object InvalidChecksum : VoltaireError("Invalid checksum")
    object OutOfMemory : VoltaireError("Out of memory")
    object InvalidInput : VoltaireError("Invalid input")
    object InvalidSignature : VoltaireError("Invalid signature")
    object InvalidSelector : VoltaireError("Invalid selector")
    object UnsupportedType : VoltaireError("Unsupported type")
    object MaxLengthExceeded : VoltaireError("Max length exceeded")
    object InvalidAccessList : VoltaireError("Invalid access list")
    object InvalidAuthorization : VoltaireError("Invalid authorization")
    class Unknown(code: Int) : VoltaireError("Unknown error: $code")

    companion object {
        fun fromCode(code: Int): VoltaireError = when (code) {
            -1 -> InvalidHex
            -2 -> InvalidLength
            -3 -> InvalidChecksum
            -4 -> OutOfMemory
            -5 -> InvalidInput
            -6 -> InvalidSignature
            -7 -> InvalidSelector
            -8 -> UnsupportedType
            -9 -> MaxLengthExceeded
            -10 -> InvalidAccessList
            -11 -> InvalidAuthorization
            else -> Unknown(code)
        }
    }
}

/** Check result code and throw if error */
@Throws(VoltaireError::class)
internal fun checkResult(code: Int) {
    if (code != 0) {
        throw VoltaireError.fromCode(code)
    }
}

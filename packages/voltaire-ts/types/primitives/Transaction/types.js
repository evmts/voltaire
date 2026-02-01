/**
 * Transaction type discriminator
 */
export var Type;
(function (Type) {
    Type[Type["Legacy"] = 0] = "Legacy";
    Type[Type["EIP2930"] = 1] = "EIP2930";
    Type[Type["EIP1559"] = 2] = "EIP1559";
    Type[Type["EIP4844"] = 3] = "EIP4844";
    Type[Type["EIP7702"] = 4] = "EIP7702";
})(Type || (Type = {}));

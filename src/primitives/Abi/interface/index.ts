export type { InterfaceIdType } from "./InterfaceIdType.js";

export {
	ERC165_INTERFACE_ID,
	ERC20_INTERFACE_ID,
	ERC721_INTERFACE_ID,
	ERC1155_INTERFACE_ID,
} from "./constants.js";

export { getInterfaceId } from "./getInterfaceId.js";

// Namespace export
import { getInterfaceId } from "./getInterfaceId.js";
import {
	ERC165_INTERFACE_ID,
	ERC20_INTERFACE_ID,
	ERC721_INTERFACE_ID,
	ERC1155_INTERFACE_ID,
} from "./constants.js";

export const Interface = {
	getInterfaceId,
	ERC165_INTERFACE_ID,
	ERC20_INTERFACE_ID,
	ERC721_INTERFACE_ID,
	ERC1155_INTERFACE_ID,
};

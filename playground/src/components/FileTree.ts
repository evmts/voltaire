export interface FileNode {
	name: string;
	path: string;
	children?: FileNode[];
	content?: string;
}

export class FileTree {
	private container: HTMLElement;
	private files: FileNode[];
	private onFileSelect: (file: FileNode) => void;
	private activeFile: string | null = null;

	constructor(
		container: HTMLElement,
		files: FileNode[],
		onFileSelect: (file: FileNode) => void,
	) {
		this.files = files;
		this.container = container;
		this.onFileSelect = onFileSelect;
		this.render();
	}

	private render(): void {
		this.container.innerHTML = "";
		this.files.forEach((node: FileNode) => {
			this.renderNode(node, this.container);
		});
	}

	private renderNode(node: FileNode, parent: HTMLElement): void {
		if (node.children) {
			// Folder wrapper
			const folderWrapper = document.createElement("div");

			// Folder header
			const folder = document.createElement("div");
			folder.className = "file-tree-folder expanded";
			folder.innerHTML = `<span class="file-tree-folder-icon"></span>${node.name}`;

			const childrenContainer = document.createElement("div");
			childrenContainer.className = "file-tree-children";

			folder.addEventListener("click", (e) => {
				e.stopPropagation();
				folder.classList.toggle("expanded");
				childrenContainer.style.display = folder.classList.contains("expanded")
					? "block"
					: "none";
			});

			node.children.forEach((child) =>
				this.renderNode(child, childrenContainer),
			);

			folderWrapper.appendChild(folder);
			folderWrapper.appendChild(childrenContainer);
			parent.appendChild(folderWrapper);
		} else {
			// File
			const file = document.createElement("div");
			file.className = "file-tree-file";
			file.textContent = node.name;
			file.dataset.path = node.path;

			if (this.activeFile === node.path) {
				file.classList.add("active");
			}

			file.addEventListener("click", () => {
				this.setActiveFile(node.path);
				this.onFileSelect(node);
			});

			parent.appendChild(file);
		}
	}

	private setActiveFile(path: string): void {
		this.activeFile = path;
		this.container.querySelectorAll(".file-tree-file").forEach((el) => {
			if ((el as HTMLElement).dataset.path === path) {
				el.classList.add("active");
			} else {
				el.classList.remove("active");
			}
		});
	}
}

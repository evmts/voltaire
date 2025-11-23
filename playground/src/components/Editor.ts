import { init } from 'modern-monaco/core';

export class Editor {
  private editor: any = null;
  private monaco: any = null;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async init(): Promise<void> {
    // Load monaco-editor-core (without LSP)
    this.monaco = await init({
      theme: 'vitesse-dark',
    });

    // Create editor instance
    this.editor = this.monaco.editor.create(this.container, {
      value: '// Select a file from the tree to begin',
      language: 'typescript',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      wrappingIndent: 'indent',
      padding: { top: 8, bottom: 8 },
    });
  }

  setValue(value: string): void {
    if (this.editor) {
      this.editor.setValue(value);
    }
  }

  getValue(): string {
    return this.editor?.getValue() || '';
  }

  setReadOnly(readOnly: boolean): void {
    if (this.editor) {
      this.editor.updateOptions({ readOnly });
    }
  }
}

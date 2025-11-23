import './style.css';
import { FileTree, type FileNode } from './components/FileTree.js';
import { Editor } from './components/Editor.js';
import { Console } from './components/Console.js';
import { Executor } from './runtime/Executor.js';
import { primitiveExamples } from './examples/primitives.js';
import { cryptoExamples } from './examples/crypto.js';

// Build file tree structure
const fileTree: FileNode[] = [
  {
    name: 'Primitives',
    path: 'primitives',
    children: Object.entries(primitiveExamples).map(([name, content]) => ({
      name,
      path: `primitives/${name}`,
      content,
    })),
  },
  {
    name: 'Cryptography',
    path: 'crypto',
    children: Object.entries(cryptoExamples).map(([name, content]) => ({
      name,
      path: `crypto/${name}`,
      content,
    })),
  },
];

// State
let currentFile: FileNode | null = null;
let restoreConsole: (() => void) | null = null;

// Initialize components
const editor = new Editor(document.getElementById('editor')!);
const consoleComponent = new Console(document.getElementById('console-content')!);
const executor = new Executor();

// File selection handler
function handleFileSelect(file: FileNode): void {
  if (!file.content) return;

  currentFile = file;
  editor.setValue(file.content);

  const fileLabel = document.getElementById('current-file')!;
  fileLabel.textContent = file.path;

  const runButton = document.getElementById('run-button') as HTMLButtonElement;
  runButton.disabled = false;

  consoleComponent.clear();
}

// Run button handler
async function handleRun(): Promise<void> {
  if (!currentFile) return;

  const runButton = document.getElementById('run-button') as HTMLButtonElement;
  runButton.disabled = true;
  runButton.textContent = 'Running...';

  consoleComponent.clear();

  // Restore previous console capture if exists
  if (restoreConsole) {
    restoreConsole();
  }

  // Capture console output
  restoreConsole = consoleComponent.captureConsole();

  try {
    const code = editor.getValue();
    await executor.execute(code);
  } catch (error) {
    // Error already logged to console by executor
  } finally {
    runButton.disabled = false;
    runButton.textContent = 'Run';
  }
}

// Initialize app
async function init(): Promise<void> {
  console.log('Initializing playground...');
  console.log('File tree data:', fileTree);

  // Initialize editor
  await editor.init();
  console.log('Editor initialized');

  // Initialize file tree
  const fileTreeEl = document.getElementById('file-tree');
  console.log('File tree element:', fileTreeEl);
  new FileTree(fileTreeEl!, fileTree, handleFileSelect);
  console.log('File tree rendered');

  // Setup run button
  const runButton = document.getElementById('run-button')!;
  runButton.addEventListener('click', handleRun);
  console.log('Playground ready');
}

// Start app
init().catch(console.error);

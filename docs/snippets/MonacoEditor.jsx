import { useEffect, useRef } from 'react';

export function MonacoEditor({
  defaultCode = '// Write your code here\nconsole.log("Hello, Tevm!");',
  height = 600,
  title = "Try It Now",
  description = "Edit and experiment with live Tevm code examples."
}) {
  const mountRef = useRef(null);
  const editorRef = useRef(null);
  const workerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Detect current theme from Mintlify's DOM
    function getCurrentTheme() {
      return document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs';
    }

    // Create Web Worker for sandboxed execution
    function createWorker() {
      const workerCode = 'self.onmessage = function(e) {' +
        '  const { code } = e.data;' +
        '  const console = {' +
        '    log: (...args) => {' +
        '      self.postMessage({' +
        '        type: "log",' +
        '        args: args.map(arg => {' +
        '          if (typeof arg === "object") {' +
        '            try { return JSON.stringify(arg, null, 2); }' +
        '            catch { return String(arg); }' +
        '          }' +
        '          return String(arg);' +
        '        })' +
        '      });' +
        '    },' +
        '    error: (...args) => {' +
        '      self.postMessage({' +
        '        type: "error",' +
        '        args: args.map(arg => String(arg))' +
        '      });' +
        '    },' +
        '    warn: (...args) => {' +
        '      self.postMessage({' +
        '        type: "warn",' +
        '        args: args.map(arg => String(arg))' +
        '      });' +
        '    }' +
        '  };' +
        '  try {' +
        '    const fn = new Function("console", code);' +
        '    fn(console);' +
        '    self.postMessage({ type: "complete" });' +
        '  } catch (error) {' +
        '    self.postMessage({' +
        '      type: "error",' +
        '      args: [error.message]' +
        '    });' +
        '  }' +
        '};';

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      return new Worker(URL.createObjectURL(blob));
    }

    // Add log entry to console output
    function addLog(type, args, consoleOutput) {
      const entry = document.createElement('div');
      entry.style.marginBottom = '0.5rem';
      entry.style.paddingLeft = '1rem';
      entry.style.borderLeft = '3px solid';

      if (type === 'log') {
        entry.style.borderLeftColor = '#4CAF50';
        entry.style.color = '#ccc';
      } else if (type === 'error') {
        entry.style.borderLeftColor = '#f44336';
        entry.style.color = '#ff6b6b';
      } else if (type === 'warn') {
        entry.style.borderLeftColor = '#ff9800';
        entry.style.color = '#ffb74d';
      }

      entry.textContent = args.join(' ');

      // Remove placeholder if present
      const placeholder = consoleOutput.querySelector('[style*="italic"]');
      if (placeholder) placeholder.remove();

      consoleOutput.appendChild(entry);
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    // Setup code execution
    function setupCodeExecution(editor, runButton, clearButton, consoleOutput) {
      function executeCode() {
        // Clear previous output
        consoleOutput.innerHTML = '';

        // Terminate previous worker if running
        if (workerRef.current) {
          workerRef.current.terminate();
          clearTimeout(timeoutRef.current);
        }

        // Update button state
        runButton.textContent = '⏸ Running...';
        runButton.disabled = true;
        runButton.style.opacity = '0.7';

        // Create new worker
        workerRef.current = createWorker();

        // Set up timeout (5 seconds)
        timeoutRef.current = setTimeout(() => {
          workerRef.current.terminate();
          addLog('error', ['Execution timeout (5s limit)'], consoleOutput);
          resetButton();
        }, 5000);

        // Handle messages from worker
        workerRef.current.onmessage = (e) => {
          const { type, args } = e.data;

          if (type === 'complete') {
            clearTimeout(timeoutRef.current);
            resetButton();
          } else if (type === 'log' || type === 'error' || type === 'warn') {
            addLog(type, args, consoleOutput);
          }
        };

        // Handle worker errors
        workerRef.current.onerror = (error) => {
          clearTimeout(timeoutRef.current);
          addLog('error', ['Worker error:', error.message], consoleOutput);
          resetButton();
        };

        // Get code and execute
        const code = editor.getValue();
        workerRef.current.postMessage({ code });
      }

      function resetButton() {
        runButton.textContent = '▶ Run Code';
        runButton.disabled = false;
        runButton.style.opacity = '1';
      }

      function clearConsole() {
        consoleOutput.innerHTML = '<div style="color: #666; font-style: italic;">Console output will appear here...</div>';
      }

      // Event listeners
      runButton.addEventListener('click', executeCode);
      clearButton.addEventListener('click', clearConsole);

      // Hover effects
      runButton.addEventListener('mouseenter', () => {
        if (!runButton.disabled) {
          runButton.style.transform = 'scale(1.01)';
          runButton.style.boxShadow = '0 2px 8px rgba(230, 162, 60, 0.3)';
        }
      });
      runButton.addEventListener('mouseleave', () => {
        runButton.style.transform = 'scale(1)';
        runButton.style.boxShadow = 'none';
      });

      clearButton.addEventListener('mouseenter', () => {
        clearButton.style.background = 'rgba(128, 128, 128, 0.1)';
      });
      clearButton.addEventListener('mouseleave', () => {
        clearButton.style.background = 'transparent';
      });
    }

    // Initialize Monaco Editor
    async function initMonaco() {
      if (!mountRef.current) return;

      try {
        const { init } = await import('https://esm.sh/modern-monaco@0.2.2');
        const monaco = await init();

        const model = monaco.editor.createModel(defaultCode, 'typescript');

        const editorContainer = mountRef.current.querySelector('#editor-container');
        const editor = monaco.editor.create(editorContainer, {
          model: model,
          theme: getCurrentTheme(),
          fontSize: 14,
          lineHeight: 21,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16, left: 16 },
          automaticLayout: true,
          lineNumbers: 'on',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          renderLineHighlight: 'line',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          },
          tabSize: 2,
          insertSpaces: true
        });

        // Add CSS to increase gap between line numbers and content
        const style = document.createElement('style');
        style.textContent = `
          .monaco-editor .margin-view-overlays .line-numbers {
            padding-right: 16px !important;
          }
        `;
        document.head.appendChild(style);

        // Store globally for theme updates
        window.monacoInstance = monaco;
        window.monacoEditor = editor;
        editorRef.current = editor;

        // Setup code execution
        const runButton = mountRef.current.querySelector('#run-button');
        const clearButton = mountRef.current.querySelector('#clear-console-button');
        const consoleOutput = mountRef.current.querySelector('#console-output');
        setupCodeExecution(editor, runButton, clearButton, consoleOutput);

        // Trigger auto-formatting
        setTimeout(() => {
          editor.getAction('editor.action.formatDocument')?.run();
        }, 100);

        // Watch for theme changes
        const observer = new MutationObserver(() => {
          if (window.monacoInstance && editorRef.current) {
            window.monacoInstance.editor.setTheme(getCurrentTheme());
          }
        });

        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class']
        });

      } catch (e) {
        console.error('Failed to load Monaco editor:', e);
        const editorContainer = mountRef.current.querySelector('#editor-container');
        if (editorContainer) {
          editorContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: #999;">Failed to load editor</div>';
        }
      }
    }

    // Initialize on mount
    initMonaco();

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [defaultCode]);

  return (
    <div ref={mountRef} style={{ maxWidth: '1000px', margin: '5rem auto 0' }}>
      <h2 style={{
        fontSize: 'clamp(2rem, 5vw, 2.5rem)',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #E6A23C 0%, #A0522D 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: '1.1rem',
        color: '#999',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        {description}
      </p>
      <div
        id="editor-container"
        style={{
          width: '100%',
          height: `${height}px`,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden',
          position: 'relative'
        }}
      />
      <div style={{
        display: 'flex',
        gap: 0,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderTop: 'none'
      }}>
        <button
          id="run-button"
          style={{
            flex: 1,
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #E6A23C 0%, #A0522D 100%)',
            color: 'white',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontSize: '0.95rem'
          }}
        >
          ▶ Run Code
        </button>
        <button
          id="clear-console-button"
          style={{
            flex: '0 0 auto',
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            color: '#999',
            border: 'none',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontSize: '0.95rem'
          }}
        >
          Clear
        </button>
      </div>
      <div
        id="console-output"
        style={{
          minHeight: '150px',
          maxHeight: '300px',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '1rem',
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          color: '#ccc'
        }}
      >
        <div style={{ color: '#666', fontStyle: 'italic' }}>
          Console output will appear here...
        </div>
      </div>
    </div>
  );
}

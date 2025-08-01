import AppKit
import Foundation

// Reference to the main window handle (passed from Zig)
var mainWindowHandle: UInt = 0

// Function pointer to be set by the main application
var webui_run_ptr: (@convention(c) (UInt, UnsafePointer<CChar>) -> Void)? = nil

// C-compatible function to set the webui_run function pointer
@_cdecl("setWebuiRunFunction")
public func setWebuiRunFunction(_ ptr: @convention(c) (UInt, UnsafePointer<CChar>) -> Void) {
    webui_run_ptr = ptr
}

// Wrapper function that calls the function pointer
func webui_run(_ window: UInt, _ script: UnsafePointer<CChar>) {
    if let runFunc = webui_run_ptr {
        runFunc(window, script)
    } else {
        print("webui_run called but function pointer not set")
    }
}

// Extensions in Swift are like Objective-C categories
extension NSApplication {
    @objc func aboutAction(_ sender: Any?) {
        print("About menu item clicked")
    }
    
    @objc func preferencesAction(_ sender: Any?) {
        print("Preferences menu item clicked")
    }
    
    @objc func newWindowAction(_ sender: Any?) {
        print("New Window menu item clicked")
    }
    
    @objc func loadBytecodeAction(_ sender: Any?) {
        print("Load Bytecode menu item clicked")
    }
    
    @objc func saveStateAction(_ sender: Any?) {
        print("Save EVM State menu item clicked")
    }
    
    @objc func findAction(_ sender: Any?) {
        print("Find menu item clicked")
    }
    
    @objc func toggleDarkModeAction(_ sender: Any?) {
        print("Toggle Dark Mode menu item clicked")
    }
    
    @objc func runPauseAction(_ sender: Any?) {
        if mainWindowHandle != 0 {
            "handleRunPause()".withCString { script in
                webui_run(mainWindowHandle, script)
            }
        }
    }
    
    @objc func stepForwardAction(_ sender: Any?) {
        if mainWindowHandle != 0 {
            "handleStep()".withCString { script in
                webui_run(mainWindowHandle, script)
            }
        }
    }
    
    @objc func resetEVMAction(_ sender: Any?) {
        if mainWindowHandle != 0 {
            "handleReset()".withCString { script in
                webui_run(mainWindowHandle, script)
            }
        }
    }
    
    @objc func helpAction(_ sender: Any?) {
        print("Help menu item clicked")
    }
    
    @objc func githubAction(_ sender: Any?) {
        if let url = URL(string: "https://github.com/evmts/guillotine") {
            NSWorkspace.shared.open(url)
        }
    }
    
    func setupMainMenu() {
        let mainMenu = NSMenu(title: "MainMenu")
        self.mainMenu = mainMenu
        
        // Application Menu
        let appMenuItem = NSMenuItem(title: "Guillotine", action: nil, keyEquivalent: "")
        mainMenu.addItem(appMenuItem)
        let appMenu = NSMenu(title: "Guillotine")
        appMenuItem.submenu = appMenu
        
        appMenu.addItem(NSMenuItem(title: "About Guillotine", action: nil, keyEquivalent: ""))
        appMenu.addItem(.separator())
        appMenu.addItem(NSMenuItem(title: "Preferences...", action: #selector(preferencesAction), keyEquivalent: ","))
        appMenu.addItem(.separator())
        appMenu.addItem(NSMenuItem(title: "Hide Guillotine", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h"))
        
        let hideOthers = NSMenuItem(title: "Hide Others", action: #selector(NSApplication.hideOtherApplications(_:)), keyEquivalent: "h")
        hideOthers.keyEquivalentModifierMask = [.option, .command]
        appMenu.addItem(hideOthers)
        
        appMenu.addItem(NSMenuItem(title: "Show All", action: #selector(NSApplication.unhideAllApplications(_:)), keyEquivalent: ""))
        appMenu.addItem(.separator())
        appMenu.addItem(NSMenuItem(title: "Quit Guillotine", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        
        // File Menu
        let fileMenuItem = NSMenuItem(title: "File", action: nil, keyEquivalent: "")
        mainMenu.addItem(fileMenuItem)
        let fileMenu = NSMenu(title: "File")
        fileMenuItem.submenu = fileMenu
        
        fileMenu.addItem(NSMenuItem(title: "New Window", action: nil, keyEquivalent: "n"))
        fileMenu.addItem(.separator())
        fileMenu.addItem(NSMenuItem(title: "Load Bytecode...", action: nil, keyEquivalent: "o"))
        fileMenu.addItem(.separator())
        fileMenu.addItem(NSMenuItem(title: "Save EVM State...", action: nil, keyEquivalent: "s"))
        
        // Edit Menu
        let editMenuItem = NSMenuItem(title: "Edit", action: nil, keyEquivalent: "")
        mainMenu.addItem(editMenuItem)
        let editMenu = NSMenu(title: "Edit")
        editMenuItem.submenu = editMenu
        
        editMenu.addItem(withTitle: "Undo", action: #selector(UndoManager.undo), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Redo", action: #selector(UndoManager.redo), keyEquivalent: "Z")
        editMenu.addItem(.separator())
        editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Paste and Match Style", action: #selector(NSTextView.pasteAsPlainText(_:)), keyEquivalent: "V")
        editMenu.addItem(withTitle: "Delete", action: #selector(NSText.delete(_:)), keyEquivalent: "")
        editMenu.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editMenu.addItem(.separator())
        editMenu.addItem(withTitle: "Find...", action: nil, keyEquivalent: "f")
        
        // View Menu
        let viewMenuItem = NSMenuItem(title: "View", action: nil, keyEquivalent: "")
        mainMenu.addItem(viewMenuItem)
        let viewMenu = NSMenu(title: "View")
        viewMenuItem.submenu = viewMenu
        viewMenu.addItem(NSMenuItem(title: "Toggle Dark Mode", action: nil, keyEquivalent: "d"))
        
        // Execution Menu
        let executionMenuItem = NSMenuItem(title: "Execution", action: nil, keyEquivalent: "")
        mainMenu.addItem(executionMenuItem)
        let executionMenu = NSMenu(title: "Execution")
        executionMenuItem.submenu = executionMenu
        
        let runPauseItem = NSMenuItem(title: "Run/Pause", action: #selector(runPauseAction), keyEquivalent: " ")
        runPauseItem.keyEquivalentModifierMask = []
        executionMenu.addItem(runPauseItem)
        
        let stepItem = NSMenuItem(title: "Step Forward", action: #selector(stepForwardAction), keyEquivalent: "s")
        stepItem.keyEquivalentModifierMask = []
        executionMenu.addItem(stepItem)
        
        let resetItem = NSMenuItem(title: "Reset EVM", action: #selector(resetEVMAction), keyEquivalent: "r")
        resetItem.keyEquivalentModifierMask = []
        executionMenu.addItem(resetItem)
        
        // Window Menu
        let windowMenuItem = NSMenuItem(title: "Window", action: nil, keyEquivalent: "")
        mainMenu.addItem(windowMenuItem)
        let windowMenu = NSMenu(title: "Window")
        windowMenuItem.submenu = windowMenu
        
        windowMenu.addItem(NSMenuItem(title: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m"))
        windowMenu.addItem(NSMenuItem(title: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: ""))
        windowMenu.addItem(.separator())
        windowMenu.addItem(NSMenuItem(title: "Bring All to Front", action: #selector(NSApplication.arrangeInFront(_:)), keyEquivalent: ""))
        
        // Help Menu
        let helpMenuItem = NSMenuItem(title: "Help", action: nil, keyEquivalent: "")
        mainMenu.addItem(helpMenuItem)
        let helpMenu = NSMenu(title: "Help")
        helpMenuItem.submenu = helpMenu
        
        helpMenu.addItem(NSMenuItem(title: "Guillotine Help", action: nil, keyEquivalent: "?"))
        helpMenu.addItem(NSMenuItem(title: "Release Notes", action: nil, keyEquivalent: ""))
        helpMenu.addItem(.separator())
        helpMenu.addItem(NSMenuItem(title: "Guillotine on GitHub", action: #selector(githubAction), keyEquivalent: ""))
    }
}

// C-compatible wrapper functions
@_cdecl("createApplicationMenu")
public func createApplicationMenu() {
    // Ensure NSApplication is initialized
    let app = NSApplication.shared
    
    if Thread.isMainThread {
        app.setupMainMenu()
    } else {
        DispatchQueue.main.sync {
            app.setupMainMenu()
        }
    }
}

@_cdecl("setMainWindow")
public func setMainWindow(_ window: UInt) {
    mainWindowHandle = window
}
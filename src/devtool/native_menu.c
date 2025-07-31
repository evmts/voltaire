#import <AppKit/AppKit.h>
#include "webui.h"

// Reference to the main window
extern size_t main_window;

@interface NSApplication (GuillotineMenu)
- (void)setupMainMenu;
- (void)about_action:(id)sender;
- (void)preferences_action:(id)sender;
- (void)new_window_action:(id)sender;
- (void)load_bytecode_action:(id)sender;
- (void)save_state_action:(id)sender;
- (void)find_action:(id)sender;
- (void)toggle_dark_mode_action:(id)sender;
- (void)run_pause_action:(id)sender;
- (void)step_forward_action:(id)sender;
- (void)reset_evm_action:(id)sender;
- (void)help_action:(id)sender;
- (void)github_action:(id)sender;
@end


void createApplicationMenu(void) {
    @autoreleasepool {
        NSApplication *app = [NSApplication sharedApplication];
        if ([NSThread isMainThread]) {
            [app setupMainMenu];
        } else {
            dispatch_sync(dispatch_get_main_queue(), ^{
                [app setupMainMenu];
            });
        }
    }
}

@implementation NSApplication (GuillotineMenu)

- (void)about_action:(id)sender { (void)sender; NSLog(@"About menu item clicked"); }
- (void)preferences_action:(id)sender { (void)sender; NSLog(@"Preferences menu item clicked"); }
- (void)new_window_action:(id)sender { (void)sender; NSLog(@"New Window menu item clicked"); }
- (void)load_bytecode_action:(id)sender { (void)sender; NSLog(@"Load Bytecode menu item clicked"); }
- (void)save_state_action:(id)sender { (void)sender; NSLog(@"Save EVM State menu item clicked"); }
- (void)find_action:(id)sender { (void)sender; NSLog(@"Find menu item clicked"); }
- (void)toggle_dark_mode_action:(id)sender { (void)sender; NSLog(@"Toggle Dark Mode menu item clicked"); }

- (void)run_pause_action:(id)sender {
    (void)sender;
    if (main_window) {
        webui_run(main_window, "handleRunPause()");
    }
}

- (void)step_forward_action:(id)sender {
    (void)sender;
    if (main_window) {
        webui_run(main_window, "handleStep()");
    }
}

- (void)reset_evm_action:(id)sender {
    (void)sender;
    if (main_window) {
        webui_run(main_window, "handleReset()");
    }
}

- (void)help_action:(id)sender { (void)sender; NSLog(@"Help menu item clicked"); }
- (void)github_action:(id)sender {
    (void)sender;
    NSURL *url = [NSURL URLWithString:@"https://github.com/evmts/guillotine"];
    [[NSWorkspace sharedWorkspace] openURL:url];
}

- (void)setupMainMenu {
    NSMenu *mainMenu = [[NSMenu alloc] initWithTitle:@"MainMenu"];
    [self setMainMenu:mainMenu];

    // Application Menu
    NSMenuItem *appMenuItem = [[NSMenuItem alloc] initWithTitle:@"Guillotine" action:nil keyEquivalent:@""];
    [mainMenu addItem:appMenuItem];
    NSMenu *appMenu = [[NSMenu alloc] initWithTitle:@"Guillotine"];
    [appMenuItem setSubmenu:appMenu];

    [appMenu addItem:[[NSMenuItem alloc] initWithTitle:@"About Guillotine" action:nil keyEquivalent:@""]];
    [appMenu addItem:[NSMenuItem separatorItem]];
    [appMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Preferences..." action:@selector(preferences_action:) keyEquivalent:@","]];
    [appMenu addItem:[NSMenuItem separatorItem]];
    [appMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Hide Guillotine" action:@selector(hide:) keyEquivalent:@"h"]];
    NSMenuItem *hideOthers = [[NSMenuItem alloc] initWithTitle:@"Hide Others" action:@selector(hideOtherApplications:) keyEquivalent:@"h"];
    [hideOthers setKeyEquivalentModifierMask:(NSEventModifierFlagOption | NSEventModifierFlagCommand)];
    [appMenu addItem:hideOthers];
    [appMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Show All" action:@selector(unhideAllApplications:) keyEquivalent:@""]];
    [appMenu addItem:[NSMenuItem separatorItem]];
    [appMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Quit Guillotine" action:@selector(terminate:) keyEquivalent:@"q"]];

    // File Menu
    NSMenuItem *fileMenuItem = [[NSMenuItem alloc] initWithTitle:@"File" action:nil keyEquivalent:@""];
    [mainMenu addItem:fileMenuItem];
    NSMenu *fileMenu = [[NSMenu alloc] initWithTitle:@"File"];
    [fileMenuItem setSubmenu:fileMenu];
    
    [fileMenu addItem:[[NSMenuItem alloc] initWithTitle:@"New Window" action:nil keyEquivalent:@"n"]];
    [fileMenu addItem:[NSMenuItem separatorItem]];
    [fileMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Load Bytecode..." action:nil keyEquivalent:@"o"]];
    [fileMenu addItem:[NSMenuItem separatorItem]];
    [fileMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Save EVM State..." action:nil keyEquivalent:@"s"]];

    // Edit Menu
    NSMenuItem *editMenuItem = [[NSMenuItem alloc] initWithTitle:@"Edit" action:nil keyEquivalent:@""];
    [mainMenu addItem:editMenuItem];
    NSMenu *editMenu = [[NSMenu alloc] initWithTitle:@"Edit"];
    [editMenuItem setSubmenu:editMenu];

    [editMenu addItemWithTitle:@"Undo" action:@selector(undo:) keyEquivalent:@"z"];
    [editMenu addItemWithTitle:@"Redo" action:@selector(redo:) keyEquivalent:@"Z"];
    [editMenu addItem:[NSMenuItem separatorItem]];
    [editMenu addItemWithTitle:@"Cut" action:@selector(cut:) keyEquivalent:@"x"];
    [editMenu addItemWithTitle:@"Copy" action:@selector(copy:) keyEquivalent:@"c"];
    [editMenu addItemWithTitle:@"Paste" action:@selector(paste:) keyEquivalent:@"v"];
    [editMenu addItemWithTitle:@"Paste and Match Style" action:@selector(pasteAsPlainText:) keyEquivalent:@"V"];
    [editMenu addItemWithTitle:@"Delete" action:@selector(delete:) keyEquivalent:@""];
    [editMenu addItemWithTitle:@"Select All" action:@selector(selectAll:) keyEquivalent:@"a"];
    [editMenu addItem:[NSMenuItem separatorItem]];
    [editMenu addItemWithTitle:@"Find..." action:nil keyEquivalent:@"f"];

    // View Menu
    NSMenuItem *viewMenuItem = [[NSMenuItem alloc] initWithTitle:@"View" action:nil keyEquivalent:@""];
    [mainMenu addItem:viewMenuItem];
    NSMenu *viewMenu = [[NSMenu alloc] initWithTitle:@"View"];
    [viewMenuItem setSubmenu:viewMenu];
    [viewMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Toggle Dark Mode" action:nil keyEquivalent:@"d"]];

    // Execution Menu
    NSMenuItem *executionMenuItem = [[NSMenuItem alloc] initWithTitle:@"Execution" action:nil keyEquivalent:@""];
    [mainMenu addItem:executionMenuItem];
    NSMenu *executionMenu = [[NSMenu alloc] initWithTitle:@"Execution"];
    [executionMenuItem setSubmenu:executionMenu];

    NSMenuItem *runPauseItem = [[NSMenuItem alloc] initWithTitle:@"Run/Pause" action:@selector(run_pause_action:) keyEquivalent:@"␣"];
    [runPauseItem setKeyEquivalentModifierMask:0];
    [executionMenu addItem:runPauseItem];
    
    NSMenuItem *stepItem = [[NSMenuItem alloc] initWithTitle:@"Step Forward" action:@selector(step_forward_action:) keyEquivalent:@"s"];
    [stepItem setKeyEquivalentModifierMask:0];
    [executionMenu addItem:stepItem];

    NSMenuItem *resetItem = [[NSMenuItem alloc] initWithTitle:@"Reset EVM" action:@selector(reset_evm_action:) keyEquivalent:@"r"];
    [resetItem setKeyEquivalentModifierMask:0];
    [executionMenu addItem:resetItem];
    
    // Window Menu
    NSMenuItem *windowMenuItem = [[NSMenuItem alloc] initWithTitle:@"Window" action:nil keyEquivalent:@""];
    [mainMenu addItem:windowMenuItem];
    NSMenu *windowMenu = [[NSMenu alloc] initWithTitle:@"Window"];
    [windowMenuItem setSubmenu:windowMenu];
    
    [windowMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Minimize" action:@selector(performMiniaturize:) keyEquivalent:@"m"]];
    [windowMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Zoom" action:@selector(performZoom:) keyEquivalent:@""]];
    [windowMenu addItem:[NSMenuItem separatorItem]];
    [windowMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Bring All to Front" action:@selector(arrangeInFront:) keyEquivalent:@""]];
    
    // Help Menu
    NSMenuItem *helpMenuItem = [[NSMenuItem alloc] initWithTitle:@"Help" action:nil keyEquivalent:@""];
    [mainMenu addItem:helpMenuItem];
    NSMenu *helpMenu = [[NSMenu alloc] initWithTitle:@"Help"];
    [helpMenuItem setSubmenu:helpMenu];
    
    [helpMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Guillotine Help" action:nil keyEquivalent:@"?"]];
    [helpMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Release Notes" action:nil keyEquivalent:@""]];
    [helpMenu addItem:[NSMenuItem separatorItem]];
    [helpMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Guillotine on GitHub" action:@selector(github_action:) keyEquivalent:@""]];
}

@end

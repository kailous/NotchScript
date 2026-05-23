# Native Hello World Plan

## Goal

Build the smallest possible native macOS proof of concept without installing full Xcode:

- Transparent always-on-top AppKit panel.
- Black Dynamic Island style pill.
- `Hello World` text.
- Mouse pass-through by default.
- Buildable with Command Line Tools and `swiftc`.

## What Is Required

Already available on this machine:

- Command Line Tools: `/Library/Developer/CommandLineTools`
- Swift compiler: `swiftc`
- macOS SDK: `/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk`

Not required for the first prototype:

- Full Xcode.
- Apple Developer account.
- Code signing identity.
- App Store packaging.

## Minimal Architecture

```text
native/
  Sources/
    main.swift
  build.sh
  run.sh
```

The first version is a single-process AppKit program. It does not embed Electron or WebView yet.

## Implementation Steps

1. Create an `NSApplication`.
2. Create a borderless `NSPanel`.
3. Configure the panel:
   - transparent background
   - no title bar
   - no traffic-light buttons
   - high window level
   - visible on all Spaces
   - mouse pass-through
4. Compute top-center position using `NSScreen.main`.
5. Draw a black rounded pill with an `NSView`.
6. Add a green status dot and `Hello World` label.
7. Run the AppKit event loop.

## Validation Criteria

- `native/build.sh` creates `native/build/NotchScriptNative`.
- `native/run.sh` launches a black top-center island.
- No Xcode project is required.
- No Electron process is required.

## Known Limits

This prototype still cannot change physical hardware behavior. It can, however, use AppKit window levels and positioning more directly than Electron. The next validation target is whether AppKit can place the panel closer to the menu bar/notch area on the target machine.

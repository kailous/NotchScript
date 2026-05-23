import AppKit
import CoreGraphics
import WebKit

final class IslandWebView: NSView {
    private let webView: WKWebView
    private var trackingAreaRef: NSTrackingArea?

    override init(frame frameRect: NSRect) {
        let configuration = WKWebViewConfiguration()
        configuration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        webView = WKWebView(frame: frameRect, configuration: configuration)

        super.init(frame: frameRect)

        wantsLayer = true
        layer?.backgroundColor = NSColor.clear.cgColor

        webView.setValue(false, forKey: "drawsBackground")
        webView.frame = bounds
        webView.autoresizingMask = [.width, .height]
        addSubview(webView)

        loadHTML()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func loadHTML() {
        let resourcesURL = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("Resources", isDirectory: true)
        let htmlURL = resourcesURL.appendingPathComponent("index.html")
        webView.loadFileURL(htmlURL, allowingReadAccessTo: resourcesURL)
    }

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if let trackingAreaRef {
            removeTrackingArea(trackingAreaRef)
        }

        let area = NSTrackingArea(
            rect: bounds,
            options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect],
            owner: self,
            userInfo: nil
        )
        addTrackingArea(area)
        trackingAreaRef = area
    }

    override func mouseEntered(with event: NSEvent) {
        setExpanded(true)
    }

    override func mouseExited(with event: NSEvent) {
        setExpanded(false)
    }

    private func setExpanded(_ expanded: Bool) {
        webView.evaluateJavaScript("window.setExpanded(\(expanded ? "true" : "false"))")
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var panel: NSPanel?
    private let panelSize = NSSize(width: 320, height: 64)
    private let topIntrusion: CGFloat = 32

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        logScreens()
        createPanel()
    }

    private func logScreens() {
        for (index, screen) in NSScreen.screens.enumerated() {
            let displayID = displayID(for: screen) ?? 0
            let isBuiltin = displayID != 0 && CGDisplayIsBuiltin(displayID) != 0
            print("screen[\(index)] id=\(displayID) builtin=\(isBuiltin) frame=\(screen.frame) visible=\(screen.visibleFrame) scale=\(screen.backingScaleFactor)")
        }
    }

    private func targetScreen() -> NSScreen? {
        if let builtin = NSScreen.screens.first(where: { screen in
            guard let displayID = displayID(for: screen) else { return false }
            return CGDisplayIsBuiltin(displayID) != 0
        }) {
            return builtin
        }

        return NSScreen.main ?? NSScreen.screens.first
    }

    private func displayID(for screen: NSScreen) -> CGDirectDisplayID? {
        screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? CGDirectDisplayID
    }

    private func createPanel() {
        guard let screen = targetScreen() else { return }

        let frame = panelFrame(for: panelSize, on: screen)
        let panel = NSPanel(
            contentRect: frame,
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )

        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.level = .screenSaver
        panel.ignoresMouseEvents = false
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary, .ignoresCycle]
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        panel.contentView = IslandWebView(frame: NSRect(origin: .zero, size: panelSize))
        panel.orderFrontRegardless()

        self.panel = panel
    }

    private func panelFrame(for size: NSSize, on screen: NSScreen) -> NSRect {
        let anchorFrame = screen.visibleFrame
        let topEdge = anchorFrame.maxY + topIntrusion

        return NSRect(
            x: anchorFrame.midX - size.width / 2,
            y: topEdge - size.height,
            width: size.width,
            height: size.height
        )
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()

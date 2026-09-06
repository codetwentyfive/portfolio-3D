# Mobile project context and navigation

September 6, 2026. The initial mobile context/navigation work was published as `d6b9ff9`. This follow-up makes the home view fit the viewport and adds scene transitions.

## Visitor flow

- A visible introduction explains that each island is a project by Chingis. Every world has a project title and one sentence connecting the miniature to the actual work, in English and German.
- Drag the island to rotate it. A separately labeled swipe strip below the model changes worlds; these gestures never compete on the same surface.
- Large Previous/Next arrows sit beside the model on every screen, with neighboring project names in their accessible labels. Both arrows and horizontal swipes wrap continuously through all six worlds. The index and six-segment indicator show the visitor's position.
- The swipe strip also supports keyboard Left/Right. Vertical and strongly diagonal gestures are rejected; a gesture that begins as vertical scrolling cannot later become navigation. Pointer cancellation and lost capture clear the gesture.
- The project link now has a visible action label. Inspection, pause/reset and ger finishes are under the labeled 3D controls disclosure.
- Selecting a different world prepares its GLTF assets while the current world remains visible. A 180ms directional departure precedes the swap, followed by a 460ms eased arrival with a small settling motion. The title, project link and shareable query update together at the swap. Inspection zoom resets.
- Repeated navigation is locked during a transition. A 15-second loading timeout keeps the previous world available with a retry message. Reduced motion still waits for preparation but skips both scene animations. Browser history restoration cancels pending transitions.

## Layout and performance

The home main element is a `100dvh` grid (with a `100svh` fallback), divided between the scene and a compact legal/contact footer. Inside it, automatic title/control rows surround a `minmax(0, 1fr)` stage. There is no fixed minimum canvas height forcing the navigation below the viewport. Spacing and type scale with viewport height, and safe-area insets protect controls on notched devices. Other pages retain their scrolling layouts and full footers.

Short landscape screens use two columns: context/actions on the left, the world on the right. Desktop keeps its full project index, caption and view tools, with height-aware spacing. Music/menu buttons share aligned gutters. Expanded mobile navigation scrolls internally when needed.

No carousel dependency or duplicate canvas is added. Preparation happens only for the requested destination, using the same `useGLTF` cache as the rendered models. CSS transforms animate the single canvas. Existing DPR limits and demand rendering remain; automatic 3D motion pauses while transitioning. Transform layer promotion is limited to the animation phases.

## Verification

```powershell
npm run build
node --test scripts/world-transition.test.mjs scripts/world-navigation.test.mjs scripts/audio-controller.test.mjs scripts/security-headers.test.mjs scripts/turntable-motion.test.mjs scripts/project-assets.test.mjs
```

Production build and all 38 tests pass. Eight transition tests cover asset readiness, phase ordering, repeated taps, no-op selection, wrap direction, stale callbacks, reduced motion and retry after timeout. Existing tests cover swipes, translated content, turntable behavior, audio, asset budgets and security headers. Lint passes with the pre-existing HomeInfo image warning; the build still reports stale Browserslist data.

Chromium viewport checks include 390x844, 430x932 and 320x568 English, 320x480 German, 844x390 and 667x375 landscape, 1280x720 and 1024x600 desktop, and a shallow 1280x500 desktop window. In these checks the document fits both axes, with visible titles, model arrows, project actions, world switcher and footer. The smallest German layout also retains usable expanded 3D controls and an internally scrollable menu. Arrow/keyboard wraparound, directional departure, one-canvas retention and production navigation to the original island are verified. Browser error logs are clean. Physical touch, Safari and actual device orientation remain unverified.

Release workflow: commit this update to `main` and deploy through the existing Vercel Git integration. Unrelated local blog drafts are excluded from the release.

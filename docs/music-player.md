# Editorial music player

September 6, 2026. Replaces the old expanding play bubble without changing the original SoundCloud playlist.

## Interaction

- The compact Sound disclosure opens a non-modal clear-glass panel. Opening it does not contact SoundCloud.
- Enable SoundCloud explicitly loads the SDK and playlist iframe. It does not autoplay; Play is a separate user gesture after Ready.
- The connected launcher has a separate quick play/pause button. Closing the panel, scrolling or following same-locale page links does not stop playback.
- Native range inputs provide seek and volume interaction with pointer, touch and keyboard semantics. No global Space or arrow shortcuts compete with the 3D turntable or page navigation.
- Escape closes the panel and returns focus. Outside pointer interaction dismisses it. Mobile uses 44px glyph controls and a viewport-bounded panel.
- Disconnect stops the session and removes the iframe. Consent is not persisted. Locale changes remount the locale layout and disconnect music safely.
- Loading, starting and pausing are distinct bounded states. A failed connection offers Retry and the native SoundCloud player; blocked playback offers another explicit Play gesture. No automatic playback retries.

The presentation uses the existing ink, stone and rust palette, typography, ruled separators and transparent refractive glass. It stays available near the header rather than disappearing at the footer.

## Ownership

- `components/AudioPlayer.tsx`: panel, focus, disclosure, consent and accessible transport.
- `components/audio/AudioGlyph.tsx`: consistent small SVG controls.
- `hooks/useSoundCloud.ts`: one widget lifecycle per connection, shared audio state and optional hardware Media Session controls.
- `lib/audio/soundcloud-api.ts`: cached lazy SDK loading, 12-second deadline, fresh request after failure.
- `lib/audio/soundcloud-controller.ts`: authoritative playback events, synchronous user intent, metadata revisions and cleanup. READY deadline is 15 seconds; Play deadline is 5 seconds. Pause checks once after 1.5 seconds, with a further 1.5-second callback deadline.
- `scripts/audio-controller.test.mjs`: deterministic widget and timer mocks; no third-party network needed.

According to the [official SoundCloud widget API](https://developers.soundcloud.com/docs/api/html5-widget), getters are asynchronous and PLAY_PROGRESS reports position. Position events therefore never change the transport to Playing. Playlist advancement is left to SoundCloud; custom repeat only wraps the final track. Listeners are unbound on disposal, with guarded cleanup because the SDK can throw when posting to an iframe that a locale unmount already removed.

## Verification

```powershell
npm run build
node --test scripts/audio-controller.test.mjs scripts/security-headers.test.mjs scripts/turntable-motion.test.mjs scripts/project-assets.test.mjs
```

Production build and all 24 tests pass, including nine audio regressions. Existing HomeInfo image-lint and stale Browserslist notices remain.

Actual Chromium checks on localhost:3000 covered opt-in with no autoplay, Voices Instrumental playback and advancing time, quick pause, close/reopen, paused track navigation to Walk Home, keyboard seek/volume, Escape focus, same-locale About navigation, German-to-English cleanup and disconnect. The final fresh-tab checks had no console errors. Desktop and narrow 320px layout checks passed without horizontal overflow. Physical-touch devices, Safari and hardware media keys were not tested. Network and playback timeouts are covered by controller mocks, not browser network interception.

No new application dependencies, playlist replacements, commit, push or deployment in this pass.

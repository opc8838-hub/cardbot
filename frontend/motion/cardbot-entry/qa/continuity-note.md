# Video-tail to login-card continuity

- The complete scored entrance is fixed at 10.000 seconds: 4.800 seconds of multilingual greeting, 3.400 seconds of card film, then the existing 1.800-second login turn.
- `cardbot-intro-score.m4a` is a lossless stream copy of the 9.217-second AAC track from the user-supplied QuickTime file. It starts with the first greeting and ends naturally during the final login settle; it is not time-stretched.
- Browsers may block audible autoplay on the first page load. The intro first tries sound on, falls back to a truthful muted state, and seeks to the current entrance time when the user enables sound. Replays launched from the workbench are user-initiated and start the score from zero.

- Source sample: `video-tail.png`, captured from the final stable video pose at 3.35 seconds.
- Verified desktop viewports: 1920 × 940 and 1787 × 678 CSS pixels; the video is rendered with `object-fit: cover`.
- The video element is no longer destroyed at the seam. Its decoded tail remains in the same DOM layer while the CSS card takes over, removing the former full-frame replacement beat.
- The login card starts at a measured 230 × 279 CSS pixel footprint, with a 14-pixel vertical correction and a two-axis scale that matches the source card instead of uniformly shrinking it.
- At 1787 × 678, the first two measured frames grow from 228.8 × 265.2 to 230.0 × 269.9 pixels, so the handoff cannot begin with a shrink beat.
- The eye motif is aligned independently to the final video frame. Its measured first-frame span is 96 pixels wide, matching the 97-pixel source span within one pixel.
- The first six frames hold the matched geometry, then the same compositor layer rotates and enlarges into the white login face.
- The black back is removed exactly at the edge-on crossover; the white face takes over during the same rotation, so no enlarged black CardBot frame appears before the login form.
- Rotation and enlargement now run on one continuous easing curve, avoiding the repeated acceleration and braking caused by independently eased intermediate stops.
- Runtime remains transform-only at 60 fps; reduced-motion continues to show the final login state.

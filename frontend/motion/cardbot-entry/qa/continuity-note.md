# Video-tail to login-card continuity

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

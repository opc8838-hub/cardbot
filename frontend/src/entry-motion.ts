import timeline from '../motion/cardbot-entry/build/timeline.json';

export const ENTRY_MOTION = Object.freeze({
  fps: timeline.fps,
  helloInitialMs: timeline.runtime.helloInitialMs,
  helloTransitionMs: timeline.runtime.helloTransitionMs,
  helloHoldMs: timeline.runtime.helloHoldMs,
  videoFrames: timeline.runtime.videoFrames,
  videoDurationSeconds: timeline.runtime.videoDurationSeconds,
  loginFrames: timeline.runtime.loginFrames,
  loginDurationMs: timeline.runtime.loginDurationMs,
  loginFrameStops: timeline.runtime.loginFrameStops,
  introTotalMs: timeline.runtime.introTotalMs,
  audioDurationSeconds: timeline.runtime.audioDurationSeconds
});

export const durationWithinOneFrame = (actualSeconds: number) =>
  Math.abs(actualSeconds - ENTRY_MOTION.videoDurationSeconds) <= 1 / ENTRY_MOTION.fps;

async page => {
  const video = await page.waitForSelector('.intro-film', { timeout: 12000 });
  await page.addStyleTag({ content: '.login-card{animation-play-state:paused!important}.login-content{animation-play-state:paused!important}' });
  await video.evaluate(node => {
    node.pause();
    node.currentTime = 3.35;
  });
  await page.waitForTimeout(450);
  const videoEyes = await video.evaluate(node => {
    const rect = node.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const sourceRatio = node.videoWidth / node.videoHeight;
    const targetRatio = canvas.width / canvas.height;
    let sx = 0;
    let sy = 0;
    let sw = node.videoWidth;
    let sh = node.videoHeight;
    if (targetRatio > sourceRatio) {
      sh = sw / targetRatio;
      sy = (node.videoHeight - sh) / 2;
    } else {
      sw = sh * targetRatio;
      sx = (node.videoWidth - sw) / 2;
    }
    context.drawImage(node, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const bounds = { left: canvas.width, top: canvas.height, right: 0, bottom: 0, count: 0 };
    for (let y = Math.floor(canvas.height * .25); y < Math.ceil(canvas.height * .75); y += 1) {
      for (let x = Math.floor(canvas.width * .35); x < Math.ceil(canvas.width * .65); x += 1) {
        const offset = (y * canvas.width + x) * 4;
        if (pixels[offset] > 235 && pixels[offset + 1] > 235 && pixels[offset + 2] > 235) {
          bounds.left = Math.min(bounds.left, x);
          bounds.top = Math.min(bounds.top, y);
          bounds.right = Math.max(bounds.right, x);
          bounds.bottom = Math.max(bounds.bottom, y);
          bounds.count += 1;
        }
      }
    }
    return bounds;
  });
  await page.screenshot({ path: 'frontend/motion/cardbot-entry/qa/video-tail.png' });
  await video.evaluate(node => node.dispatchEvent(new Event('ended')));
  const card = await page.waitForSelector('.login-card');
  await page.waitForTimeout(100);
  await page.screenshot({ path: 'frontend/motion/cardbot-entry/qa/login-first-frame.png' });
  return {
    box: await card.boundingBox(),
    transform: await card.evaluate(node => getComputedStyle(node).transform),
    opacity: await card.evaluate(node => getComputedStyle(node).opacity),
    videoEyes,
    loginEyes: await page.locator('.login-card-eyes i').evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }))
  };
}

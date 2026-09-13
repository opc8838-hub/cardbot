async page => {
  const video = await page.waitForSelector('.intro-film', { timeout: 12000 });
  await video.evaluate(node => {
    node.pause();
    node.currentTime = 3.35;
  });
  await page.waitForTimeout(450);
  const frames = [];
  await page.screenshot({ path: 'frontend/motion/cardbot-entry/qa/handoff-000-tail.png' });
  await video.evaluate(node => node.dispatchEvent(new Event('ended')));
  const card = await page.waitForSelector('.login-card');
  const overlay = page.locator('.login-screen-overlay');
  await overlay.evaluate(node => {
    node.getAnimations({ subtree: true }).forEach(animation => animation.pause());
  });
  for (const target of [0, 80, 180, 360, 540, 720, 1080, 1800]) {
    await overlay.evaluate((node, currentTime) => {
      node.getAnimations({ subtree: true }).forEach(animation => {
        animation.currentTime = currentTime;
      });
    }, target);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const box = await card.boundingBox();
    frames.push({ target, box });
    await page.screenshot({
      path: `frontend/motion/cardbot-entry/qa/handoff-${String(target).padStart(4, '0')}.png`
    });
  }
  return frames;
}

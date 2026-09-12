import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import topology from "world-atlas/land-110m.json";

const vocabulary = ["cardbot", "review", "workday", "draft", "evidence", "human", "trade", "source", "system", "today", "followup", "local"];
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
export function mountTextArt(canvas: HTMLCanvasElement, kind: "card" | "earth", onRotate?: (longitude: number) => void) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const land = feature(topology as unknown as Topology<{ land: GeometryCollection }>, (topology as unknown as Topology<{ land: GeometryCollection }>).objects.land);
  const mask = document.createElement("canvas");
  const maskCtx = mask.getContext("2d")!;
  let w = 1, h = 1, rotation = -100, frame = 0, last = 0, drag = false, previousX = 0, active = true;
  const points: { lat: number; lon: number; land: boolean; word: string }[] = [];
  function sampleEarth() {
    points.length = 0;
    const radius = Math.min(w, h) * .475;
    const size = Math.max(10, Math.min(14, radius * .041));
    const latStep = Math.max(3.2, size * 1.25 / radius * 180 / Math.PI);
    const lonStep = Math.max(8, size * 4.3 / radius * 180 / Math.PI);
    for (let lat = -84; lat <= 84; lat += latStep) {
      const step = lonStep / Math.max(.2, Math.cos(lat * Math.PI / 180));
      for (let lon = -180; lon < 180; lon += step) points.push({ lat, lon, land: geoContains(land, [lon, lat]), word: vocabulary[points.length % vocabulary.length] });
    }
  }
  function draw() {
    if (!ctx) return;
    const dark = document.documentElement.dataset.theme === "dark";
    const color = dark ? "236,237,233" : "25,27,28";
    ctx.clearRect(0, 0, w, h);
    ctx.textBaseline = "middle";
    if (kind === "card") {
      const pixels = maskCtx.getImageData(0, 0, Math.ceil(w), Math.ceil(h)).data;
      ctx.font = `${w < 600 ? 10 : 13}px Consolas, monospace`;
      let index = 0;
      for (let y = 10; y < h; y += w < 600 ? 15 : 18) {
        for (let x = -12; x < w; x += w < 600 ? 52 : 64) {
          const inside = pixels[(Math.floor(y) * Math.ceil(w) + Math.max(0, Math.floor(x + 20))) * 4 + 3] > 90;
          const variation = ((index * 17) % 9) / 9;
          ctx.fillStyle = `rgba(${color},${inside ? .22 + variation * .29 : .025 + variation * .045})`;
          ctx.fillText(vocabulary[index++ % vocabulary.length], x, y);
        }
      }
      return;
    }
    const r = Math.min(w, h) * .475, rad = Math.PI / 180;
    ctx.strokeStyle = `rgba(${color},.24)`; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.stroke();
    for (const p of points) {
      const latitude = p.lat * rad, longitude = (p.lon + rotation) * rad;
      const z = Math.cos(latitude) * Math.cos(longitude);
      if (z <= .03) continue;
      const x = w / 2 + Math.cos(latitude) * Math.sin(longitude) * r;
      const y = h / 2 - Math.sin(latitude) * r;
      ctx.font = `${Math.max(10, Math.min(14, r * .041))}px Consolas, monospace`;
      ctx.fillStyle = `rgba(${color},${p.land ? .32 + z * .64 : .022 + z * .055})`;
      ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(.25, z), 1);
      ctx.fillText(p.word, -r * .03, 0); ctx.restore();
    }
  }
  function resize() {
    const rect = canvas.getBoundingClientRect(); w = Math.max(1, Math.ceil(rect.width)); h = Math.max(1, Math.ceil(rect.height));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr; ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (kind === "card") {
      mask.width = w; mask.height = h; maskCtx.font = `900 ${w * .365}px Arial Black, Arial, sans-serif`;
      maskCtx.textAlign = "center"; maskCtx.textBaseline = "middle";
      maskCtx.save(); maskCtx.translate(w / 2, h * .51); maskCtx.scale(.98, h / (w * .42)); maskCtx.fillText("CARD", 0, 0); maskCtx.restore();
    }
    if (kind === "earth") sampleEarth();
    draw();
  }
  function tick(now: number) {
    frame = requestAnimationFrame(tick);
    if (!active || document.hidden || now - last < 42) return;
    const delta = Math.min(100, now - last); last = now;
    if (kind === "earth" && !drag && !reduced.matches) rotation += delta * .0047;
    if (kind === "earth") { draw(); onRotate?.(-rotation); }
  }
  canvas.addEventListener("pointerdown", event => { if (kind !== "earth") return; drag = true; previousX = event.clientX; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener("pointermove", event => { if (!drag) return; rotation += (event.clientX - previousX) * .22; previousX = event.clientX; draw(); onRotate?.(-rotation); });
  canvas.addEventListener("pointerup", () => { drag = false; });
  canvas.addEventListener("pointercancel", () => { drag = false; });
  canvas.addEventListener("keydown", event => { if (kind === "earth" && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); rotation += event.key === "ArrowLeft" ? -8 : 8; draw(); } });
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const theme = new MutationObserver(draw); theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const intersection = new IntersectionObserver(entries => { active = entries[0].isIntersecting; }); intersection.observe(canvas);
  resize(); frame = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(frame); observer.disconnect(); theme.disconnect(); intersection.disconnect(); };
}

type Greeting = {
  text: string;
  lang: string;
  direction?: "ltr" | "rtl";
};

type SpherePoint = {
  latitude: number;
  longitude: number;
  label: string;
  signal: boolean;
};

const INTRO_SESSION_KEY = "cardbot_intro_seen_v1";
const GREETINGS: Greeting[] = [
  { text: "Hello", lang: "en" },
  { text: "你好", lang: "zh-CN" },
  { text: "Hola", lang: "es" },
  { text: "Bonjour", lang: "fr" },
  { text: "مرحباً", lang: "ar", direction: "rtl" },
  { text: "Olá", lang: "pt" },
  { text: "こんにちは", lang: "ja" }
];

const DATA_LABELS = [
  "evidence:verified",
  "workday:same_batch",
  "review:human",
  "draft:local",
  "connector:mock",
  "connector:api",
  "connector:browser",
  "market:global",
  "source:history",
  "task:open",
  "owner:assigned",
  "risk:review",
  "last_sync:live",
  "timezone:local",
  "customer:active",
  "signal:observed"
];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

function initializeIntro() {
  const intro = document.querySelector<HTMLElement>("#cardbotIntro");
  const word = document.querySelector<HTMLElement>("#cardbotGreetingWord");
  const statement = document.querySelector<HTMLElement>("#cardbotIntroStatement");
  const skip = document.querySelector<HTMLButtonElement>("#cardbotIntroSkip");
  if (!intro || !word || !statement || !skip) return;

  const query = new URLSearchParams(window.location.search);
  const forceIntro = query.get("intro") === "1";
  const returningUser = Boolean(window.localStorage.getItem("gj_user"));
  const alreadySeen = window.sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
  let cancelled = false;
  let completed = false;

  const finish = (immediate = false) => {
    if (completed) return;
    completed = true;
    cancelled = true;
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    intro.classList.add("is-complete");
    window.removeEventListener("keydown", onKeyDown);
    if (immediate || reducedMotion.matches) intro.hidden = true;
    else window.setTimeout(() => { intro.hidden = true; }, 780);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" && event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    finish();
  };

  skip.addEventListener("click", () => finish(), { once: true });
  window.addEventListener("keydown", onKeyDown);

  if (!forceIntro && (returningUser || alreadySeen)) {
    finish(true);
    return;
  }

  if (reducedMotion.matches) {
    word.textContent = "Hello / 你好";
    word.lang = "zh-CN";
    statement.classList.add("is-visible");
    window.setTimeout(() => finish(true), 420);
    return;
  }

  const setGreeting = async (greeting: Greeting) => {
    word.classList.add("is-leaving");
    await wait(130);
    if (cancelled) return;
    word.textContent = greeting.text;
    word.lang = greeting.lang;
    word.dir = greeting.direction || "ltr";
    word.classList.remove("is-leaving");
    word.classList.add("is-entering");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => word.classList.remove("is-entering"));
    });
    await wait(190);
  };

  void (async () => {
    await wait(300);
    for (const greeting of GREETINGS.slice(1)) {
      if (cancelled) return;
      await setGreeting(greeting);
    }
    if (cancelled) return;
    statement.classList.add("is-visible");
    await wait(520);
    finish();
  })();
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function localZoneLabel() {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";
  try {
    const offset = new Intl.DateTimeFormat("en", {
      timeZone: zone,
      timeZoneName: "shortOffset"
    }).formatToParts(new Date()).find((part) => part.type === "timeZoneName")?.value;
    return offset ? `${zone} · ${offset.replace("GMT", "UTC")}` : zone;
  } catch {
    return zone;
  }
}

function initializeLiveTime() {
  const loginTime = document.querySelector<HTMLTimeElement>("#cardbotLoginTime");
  const loginZone = document.querySelector<HTMLElement>("#cardbotLoginZone");
  const workbenchTime = document.querySelector<HTMLTimeElement>("#cardbotWorkbenchTime");
  const workbenchZone = document.querySelector<HTMLElement>("#cardbotWorkbenchZone");
  const zone = localZoneLabel();

  if (loginZone) loginZone.textContent = zone;
  if (workbenchZone) {
    workbenchZone.textContent = zone;
    workbenchZone.title = zone;
  }

  const update = () => {
    const now = new Date();
    const text = formatTime(now);
    if (loginTime) {
      loginTime.dateTime = now.toISOString();
      loginTime.textContent = text;
    }
    if (workbenchTime) {
      workbenchTime.dateTime = now.toISOString();
      workbenchTime.textContent = text;
    }
  };

  update();
  const timer = window.setInterval(update, 1000);
  window.addEventListener("pagehide", () => window.clearInterval(timer), { once: true });
}

function createSpherePoints(total: number): SpherePoint[] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: total }, (_, index) => {
    const vertical = 1 - (2 * (index + .5)) / total;
    return {
      latitude: Math.asin(vertical),
      longitude: index * goldenAngle,
      label: DATA_LABELS[index % DATA_LABELS.length],
      signal: index % 11 === 0 || index % 17 === 0
    };
  });
}

function initializeDataGlobe() {
  const canvas = document.querySelector<HTMLCanvasElement>("#cardbotDataGlobe");
  const backdrop = document.querySelector<HTMLElement>("#cardbotWorkbenchBackdrop");
  const dashboard = document.querySelector<HTMLElement>("#dashboard");
  const context = canvas?.getContext("2d");
  if (!canvas || !backdrop || !dashboard || !context) return;

  const points = createSpherePoints(window.innerWidth < 1100 ? 72 : 108);
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let angle = .36;
  let lastFrame = performance.now();
  let frame = 0;
  let active = false;

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    draw();
  };

  const project = (latitude: number, longitude: number, radius: number) => {
    const rotated = longitude + angle;
    const cosLatitude = Math.cos(latitude);
    return {
      x: width / 2 + Math.sin(rotated) * cosLatitude * radius,
      y: height / 2 - Math.sin(latitude) * radius,
      depth: Math.cos(rotated) * cosLatitude
    };
  };

  const drawCurve = (samples: Array<{ latitude: number; longitude: number }>, radius: number) => {
    context.beginPath();
    let drawing = false;
    samples.forEach((sample) => {
      const point = project(sample.latitude, sample.longitude, radius);
      if (point.depth <= .015) {
        drawing = false;
        return;
      }
      if (!drawing) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
      drawing = true;
    });
    context.stroke();
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    const radius = Math.min(width, height) * .39;
    if (radius < 1) return;

    context.save();
    context.lineWidth = 1;
    context.strokeStyle = "rgba(49, 58, 51, .12)";
    context.beginPath();
    context.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    context.stroke();

    context.strokeStyle = "rgba(49, 58, 51, .075)";
    for (const latitude of [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3]) {
      const samples = Array.from({ length: 97 }, (_, index) => ({
        latitude,
        longitude: (index / 96) * Math.PI * 2
      }));
      drawCurve(samples, radius);
    }
    for (let longitude = 0; longitude < Math.PI * 2; longitude += Math.PI / 6) {
      const samples = Array.from({ length: 65 }, (_, index) => ({
        latitude: -Math.PI / 2 + (index / 64) * Math.PI,
        longitude
      }));
      drawCurve(samples, radius);
    }

    const visible = points
      .map((point) => ({ point, projected: project(point.latitude, point.longitude, radius) }))
      .filter((item) => item.projected.depth > .08)
      .sort((left, right) => left.projected.depth - right.projected.depth);

    visible.forEach(({ point, projected }, index) => {
      const alpha = .08 + projected.depth * .25;
      const size = Math.max(7, Math.min(11, 7 + projected.depth * 4));
      context.font = `${size}px ${getComputedStyle(document.documentElement).getPropertyValue("--cb-mono") || "monospace"}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = point.signal
        ? `rgba(47, 91, 255, ${Math.min(.52, alpha + .13)})`
        : `rgba(34, 42, 36, ${alpha})`;
      const label = index % 3 === 0 ? point.label.toUpperCase() : point.label;
      context.fillText(label, projected.x, projected.y);
    });
    context.restore();
  };

  const tick = (now: number) => {
    frame = 0;
    if (!active) return;
    const elapsed = Math.min(50, now - lastFrame);
    lastFrame = now;
    if (!reducedMotion.matches && !document.hidden) angle += elapsed * .000052;
    draw();
    frame = requestAnimationFrame(tick);
  };

  const syncActivity = () => {
    const nextActive = document.body.classList.contains("is-authenticated")
      && dashboard.classList.contains("active")
      && !document.hidden;
    backdrop.classList.toggle("is-visible", nextActive);
    if (nextActive === active) return;
    active = nextActive;
    if (active && !frame) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(tick);
    } else if (!active && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const observer = new MutationObserver(syncActivity);
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  observer.observe(dashboard, { attributes: true, attributeFilter: ["class"] });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  document.addEventListener("visibilitychange", syncActivity);
  reducedMotion.addEventListener("change", draw);
  window.addEventListener("pagehide", () => {
    observer.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", syncActivity);
    reducedMotion.removeEventListener("change", draw);
    if (frame) cancelAnimationFrame(frame);
  }, { once: true });

  resize();
  syncActivity();
}

initializeIntro();
initializeLiveTime();
initializeDataGlobe();


"""Check the extracted ZIP in Chromium; use --public for the published URLs."""
import io
import json
import sys
import tempfile
from pathlib import Path
from urllib.request import Request, urlopen
from zipfile import ZipFile

from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
artifacts = root / "frontend/tests/artifacts/motion-sharing"
artifacts.mkdir(parents=True, exist_ok=True)
public = "--public" in sys.argv
base = "https://opc8838-hub.github.io/cardbot/motion-kits/"

if public:
    with urlopen(Request(base + "cardbot-login-handoff.zip", headers={"User-Agent": "CardBot-release-check"}), timeout=30) as response:
        zip_data = response.read()
else:
    zip_data = (root / "motion-kits/cardbot-login-handoff.zip").read_bytes()

with tempfile.TemporaryDirectory(prefix="cardbot-motion-check-") as tmp:
    with ZipFile(io.BytesIO(zip_data)) as archive:
        assert archive.testzip() is None
        archive.extractall(tmp)
        names = archive.namelist()
        assert all(name.startswith("cardbot-login-handoff/") for name in names)
        assert "cardbot-login-handoff/LICENSE" in names

    extracted = Path(tmp) / "cardbot-login-handoff"
    spec = json.loads((extracted / "motion-spec.json").read_text(encoding="utf-8"))
    assert spec["durationMs"] == 1800

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        errors = []
        for width, height in [(1920, 1080), (390, 844)]:
            page = browser.new_page(viewport={"width": width, "height": height})
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(base + "login-handoff/" if public else (extracted / "index.html").as_uri())
            page.wait_for_load_state("networkidle")
            page.locator(".card-handoff.is-rest").wait_for(timeout=10000)
            assert page.locator(".login-content").evaluate("el => getComputedStyle(el).opacity") == "1"
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.locator("[data-replay]").click()
            page.wait_for_timeout(2400)
            assert page.locator(".card-handoff.is-rest").count() == 1
            page.screenshot(path=str(artifacts / f"login-{width}.png"))
            page.close()

        page = browser.new_page(viewport={"width": 1920, "height": 1080}, reduced_motion="reduce")
        page.goto((extracted / "index.html").as_uri())
        page.wait_for_load_state("networkidle")
        page.locator(".card-handoff.is-rest").wait_for(timeout=5000)
        result = page.evaluate("""() => {
          let settled = false;
          const card = window.CardBotHandoff.start(document.querySelector('[data-demo-stage]'), {
            sourceWidth: 220, sourceHeight: 295, onSettled: () => settled = true
          });
          return {x: card.style.getPropertyValue('--handoff-scale-x'),
                  y: card.style.getPropertyValue('--handoff-scale-y'), settled};
        }""")
        assert result == {"x": "0.5", "y": "0.5", "settled": True}, result
        page.close()

        for width in [1440, 390]:
            page = browser.new_page(viewport={"width": width, "height": 1000})
            page.goto(base if public else (root / "motion-kits/index.html").as_uri())
            page.wait_for_load_state("networkidle")
            assert page.get_by_role("link", name="下载动效 ZIP ↓").count() == 1
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.screenshot(path=str(artifacts / f"sharing-{width}.png"), full_page=True)
            page.close()

        if public:
            page = browser.new_page()
            response = page.goto(base)
            assert response.status == 200
            assert page.get_by_role("link", name="下载动效 ZIP ↓").count() == 1
            for url in ["https://opc8838-hub.github.io/bot/", "https://opc8838-hub.github.io/bot/motion.html"]:
                response = page.goto(url)
                assert response.status == 200, (url, response.status)
            page.close()

        browser.close()
        assert not errors, errors

print(f"PASS {'public' if public else 'local ZIP'}: desktop/mobile replay, final pose, calibration, reduced motion, ZIP integrity")

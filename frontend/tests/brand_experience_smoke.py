from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:5188"
ARTIFACTS = Path(__file__).resolve().parent / "artifacts"


def assert_no_horizontal_overflow(page) -> None:
    overflow = page.evaluate(
        "Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth"
    )
    assert overflow <= 1, f"horizontal overflow: {overflow}px"


with sync_playwright() as playwright:
    ARTIFACTS.mkdir(exist_ok=True)
    browser = playwright.chromium.launch(headless=True)

    desktop = browser.new_context(viewport={"width": 1440, "height": 960})
    page = desktop.new_page()
    page.goto(f"{BASE_URL}/?intro=1")
    page.wait_for_load_state("networkidle")
    page.locator("#cardbotIntro").wait_for(state="visible")
    page.screenshot(path=str(ARTIFACTS / "intro-desktop.png"))
    page.locator("#cardbotIntro").wait_for(state="hidden", timeout=6000)
    page.get_by_role("heading", name="Evidence Workday Review Draft Deliver").wait_for()
    page.locator("#loginEmail").wait_for(state="visible")
    assert page.locator("#cardbotLoginTime").inner_text() != "--:--:--"
    assert_no_horizontal_overflow(page)
    page.screenshot(path=str(ARTIFACTS / "login-desktop.png"), full_page=True)

    page.evaluate("document.body.classList.add('is-authenticated')")
    page.locator("#cardbotWorkbenchBackdrop").wait_for(state="visible")
    assert page.locator("#cardbotWorkbenchTime").inner_text() != "--:--:--"
    page.screenshot(path=str(ARTIFACTS / "workbench-desktop.png"))
    desktop.close()

    mobile = browser.new_context(viewport={"width": 390, "height": 844})
    mobile.add_init_script("sessionStorage.setItem('cardbot_intro_seen_v1', '1')")
    page = mobile.new_page()
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    page.locator("#loginEmail").wait_for(state="visible")
    assert_no_horizontal_overflow(page)
    page.screenshot(path=str(ARTIFACTS / "login-mobile.png"), full_page=True)
    mobile.close()

    reduced = browser.new_context(viewport={"width": 1280, "height": 800})
    page = reduced.new_page()
    page.emulate_media(reduced_motion="reduce")
    page.goto(f"{BASE_URL}/?intro=1")
    page.wait_for_load_state("networkidle")
    page.locator("#cardbotIntro").wait_for(state="hidden", timeout=1800)
    page.locator("#loginEmail").wait_for(state="visible")
    reduced.close()

    browser.close()

print("brand experience smoke test passed")


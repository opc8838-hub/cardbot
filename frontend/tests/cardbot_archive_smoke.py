"""Verify the actual standalone HTML with networking disabled, not the Vite entry."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
ARCHIVE = ROOT / 'archives' / 'cardbot-visual-v2.html'
ARTIFACTS = Path(__file__).resolve().parent / 'artifacts'

with sync_playwright() as p:
    ARTIFACTS.mkdir(exist_ok=True)
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce', offline=True)
    page = context.new_page()
    errors, external = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('request', lambda request: external.append(request.url) if request.url.startswith(('http:', 'https:')) else None)
    page.goto(ARCHIVE.as_uri())
    expect(page.locator('#hello-word')).to_have_text('Hello / 你好')
    page.locator('[data-action="skip"]').click()
    expect(page.locator('.capabilities span')).to_have_count(5)
    page.locator('[data-action="workspace"]').last.click()
    expect(page.locator('#text-earth')).to_be_visible()
    expect(page.locator('.task-row')).to_have_count(3)
    page.screenshot(path=str(ARTIFACTS / 'archive-v2-light.png'), full_page=True)
    page.locator('[data-action="language"]').click()
    expect(page.locator('html')).to_have_attribute('lang', 'en')
    page.locator('[data-action="theme"]').click()
    expect(page.locator('html')).to_have_attribute('data-theme', 'dark')
    page.screenshot(path=str(ARTIFACTS / 'archive-v2-dark-en.png'), full_page=True)
    page.locator('[data-action="generate"]').click()
    page.locator('#review-check').check()
    page.locator('[data-action="approve"]').click()
    page.locator('[data-action="save-draft"]').click()
    expect(page.locator('#draft-status')).to_have_text('Saved locally')
    assert page.evaluate('localStorage.getItem("cardbot_preview_v1")') is None
    assert page.evaluate('JSON.parse(localStorage.getItem("cardbot_archive_v2_preview_v1")).draft.status') == 'saved_local'
    page.reload()
    page.locator('[data-view="drafts"]').click()
    expect(page.locator('#draft-status')).to_have_text('Saved locally')
    page.once('dialog', lambda dialog: dialog.accept())
    page.locator('[data-archive-unavailable]').click()
    assert page.url.startswith('file:')
    assert not errors, errors
    assert not external, external
    browser.close()
print('PASS: standalone file, offline intro/globe, language/theme, reviewed draft persistence, isolated storage, no external requests')

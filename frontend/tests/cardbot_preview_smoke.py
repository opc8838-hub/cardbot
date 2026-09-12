"""Browser acceptance for the fictional workbench; requires the local Vite server."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE_URL = os.environ.get('CARDBOT_PREVIEW_URL', 'http://127.0.0.1:5190')
ARTIFACTS = Path(__file__).resolve().parent / 'artifacts'

def no_overflow(page):
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')

def action(page, value):
    return page.locator(f'[data-wb-action="{value}"]')

def nav(page, value):
    return page.locator(f'.wb-nav[data-view="{value}"]')

with sync_playwright() as p:
    ARTIFACTS.mkdir(exist_ok=True)
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.goto(BASE_URL + '/?intro=1')
    expect(page.locator('#hello-word')).to_be_visible()
    page.locator('.manifesto').wait_for(timeout=12000)
    expect(page.locator('.capabilities span')).to_have_count(5)
    assert page.locator('input[type="password"]').count() == 0
    page.locator('[data-action="workspace"]').last.click()
    expect(page.locator('.wb-sidebar')).to_be_visible()
    assert page.locator('.wb-legacy, a[href="/crm.html?intro=0"]').count() == 0
    expect(page.locator('#demo-user')).to_be_enabled()
    assert page.locator('.wb-topbar').evaluate("el => getComputedStyle(el).position") == 'sticky'
    assert page.locator('.wb-tour-invite').bounding_box()['height'] < 80
    expect(page.locator('#text-earth')).to_be_visible()
    expect(page.locator('.wb-zone')).to_have_count(6)
    expect(page.locator('#demo-user')).to_have_value('sales-01')
    expect(page.locator('[data-task]')).to_have_count(3)
    no_overflow(page)
    page.screenshot(path=str(ARTIFACTS / 'v3-overview-light.png'), full_page=True)
    page.evaluate('scrollTo(0, 600)')
    page.wait_for_timeout(100)
    assert page.locator('.wb-topbar').bounding_box()['y'] <= 11
    page.screenshot(path=str(ARTIFACTS / 'v3-sticky-toolbar.png'))
    page.evaluate('scrollTo(0, 0)')
    page.locator('#city').select_option('Europe/London')
    action(page, 'language').click()
    expect(page.locator('html')).to_have_attribute('lang', 'en')
    expect(page.locator('#city')).to_have_value('Europe/London')
    assert page.locator('#shanghai-greeting').inner_text() in {'Good morning', 'Good afternoon', 'Good evening'}
    action(page, 'theme').click()
    page.screenshot(path=str(ARTIFACTS / 'v3-overview-dark-en.png'), full_page=True)
    assert page.locator('.wb-legacy, a[href="/crm.html?intro=0"]').count() == 0
    action(page, 'theme').click()
    action(page, 'language').click()

    nav(page, 'workday').click()
    assert page.locator('#text-earth').count() == 0
    page.locator('[data-task="TASK-002"]').click()
    action(page, 'complete').click()
    expect(page.locator('#notice')).to_contain_text('完成依据')
    page.locator('#completion-evidence').fill('MANUAL-REPORT-001')
    action(page, 'complete').click()
    expect(page.locator('[data-task="TASK-002"]')).to_contain_text('已完成')
    action(page, 'evening').click()
    expect(page.locator('.recap')).to_contain_text('报价')
    page.screenshot(path=str(ARTIFACTS / 'v3-workday.png'), full_page=True)

    nav(page, 'evidence').click()
    expect(page.locator('.wb-mail')).to_have_count(2)
    page.locator('[data-mail="EMAIL-000"]').click()
    expect(page.locator('#EMAIL-000')).to_have_class('wb-mail highlight')
    page.screenshot(path=str(ARTIFACTS / 'v3-mail.png'), full_page=True)
    action(page, 'generate').click()
    expect(action(page, 'save-sim')).to_be_disabled()
    action(page, 'approve').click()
    expect(page.locator('#notice')).to_contain_text('勾选')
    page.locator('#review-check').check()
    action(page, 'approve').click()
    body = page.locator('#draft-body').input_value()
    action(page, 'save-fail').click()
    expect(page.locator('#notice')).to_contain_text('内容已保留')
    assert page.locator('#draft-body').input_value() == body
    action(page, 'save-sim').click()
    expect(page.locator('.wb-receipt')).to_contain_text('SIM-OKKI-DRAFT-001')
    expect(page.locator('.wb-receipt')).to_contain_text(body)
    page.screenshot(path=str(ARTIFACTS / 'v3-simulated-outbox.png'), full_page=True)
    page.goto(BASE_URL)
    nav(page, 'outbox').click()
    expect(page.locator('.wb-receipt')).to_contain_text(body)
    nav(page, 'drafts').click()
    page.locator('#draft-body').fill(body + '\nManual revision.')
    expect(action(page, 'save-sim')).to_be_disabled()
    nav(page, 'outbox').click()
    expect(page.locator('.wb-empty')).to_contain_text('还没有')
    before = page.evaluate('localStorage.getItem("cardbot_preview_v1")')

    # Playback advances by itself, pauses, rewinds, and never overwrites manual work.
    action(page, 'tour-start').click()
    expect(page.locator('.wb-player')).to_have_attribute('data-step', '0')
    expect(page.locator('[data-task]')).to_have_count(3)
    expect(page.locator('.wb-player')).to_have_attribute('data-step', '1', timeout=10000)
    action(page, 'tour-play').click()
    page.wait_for_timeout(7500)
    expect(page.locator('.wb-player')).to_have_attribute('data-step', '1')
    action(page, 'tour-next').click()
    expect(page.locator('#draft-status')).to_have_text('待人工审核')
    expect(page.locator('#draft-body')).to_have_attribute('readonly', '')
    action(page, 'tour-next').click()
    expect(page.locator('#draft-status')).to_have_text('已审核 · 待保存')
    action(page, 'tour-next').click()
    expect(page.locator('.wb-receipt')).to_contain_text('模拟器')
    page.screenshot(path=str(ARTIFACTS / 'v3-rehearsal-save.png'), full_page=True)
    action(page, 'tour-prev').click()
    expect(page.locator('#draft-status')).to_have_text('已审核 · 待保存')
    page.locator('.player-steps [data-step="5"]').click()
    expect(page.locator('[data-task="TASK-001"]')).to_contain_text('待确认')
    expect(page.locator('[data-task="TASK-002"]')).to_contain_text('已完成')
    expect(page.locator('[data-task="TASK-003"]')).to_contain_text('已完成')
    action(page, 'tour-next').click()
    expect(page.locator('#demo-user')).to_have_value('manager')
    expect(page.locator('.wb-team-task')).to_have_count(3)
    expect(action(page, 'tour-next')).to_be_disabled()
    page.screenshot(path=str(ARTIFACTS / 'v3-rehearsal-team.png'), full_page=True)
    action(page, 'tour-exit').click()
    expect(page.locator('#demo-user')).to_have_value('sales-01')
    assert page.evaluate('localStorage.getItem("cardbot_preview_v1")') == before
    nav(page, 'drafts').click()
    expect(page.locator('#draft-body')).to_have_value(body + '\nManual revision.')

    page.locator('#demo-user').select_option('sales-02')
    expect(page.locator('[data-task]')).to_have_count(0)
    assert nav(page, 'team').count() == 0
    nav(page, 'drafts').click()
    expect(page.locator('.access-boundary')).to_be_visible()
    page.locator('#demo-user').select_option('manager')
    nav(page, 'organization').click()
    expect(page.locator('.wb-identity-row')).to_have_count(4)
    action(page, 'language').click()
    no_overflow(page)
    page.screenshot(path=str(ARTIFACTS / 'v3-organization-en.png'), full_page=True)
    action(page, 'tour-start').click()
    expect(page.locator('#demo-user')).to_be_enabled()
    page.locator('#demo-user').select_option('sales-02')
    expect(page.locator('.wb-player')).to_have_count(0)
    expect(page.locator('#demo-user')).to_have_value('sales-02')
    expect(page.locator('#notice')).to_contain_text('account switched')
    assert not errors, errors
    context.close()

    for width in (390, 768, 1920):
        mobile = browser.new_context(viewport={'width': width, 'height': 940}, reduced_motion='reduce')
        page = mobile.new_page()
        page.goto(BASE_URL + '/?intro=1')
        expect(page.locator('#hello-word')).to_have_text('Hello / 你好')
        page.locator('[data-action="skip"]').click()
        page.locator('[data-action="workspace"]').last.click()
        no_overflow(page)
        page.screenshot(path=str(ARTIFACTS / f'v3-overview-{width}.png'), full_page=True)
        if width < 700:
            action(page, 'menu').click()
            expect(page.locator('.wb-sidebar')).to_be_visible()
            page.screenshot(path=str(ARTIFACTS / 'v3-navigation-mobile.png'), full_page=True)
        nav(page, 'evidence').click()
        no_overflow(page)
        action(page, 'tour-start').click()
        action(page, 'tour-play').click()
        page.locator('.player-steps [data-step="4"]').click()
        no_overflow(page)
        page.screenshot(path=str(ARTIFACTS / f'v3-rehearsal-{width}.png'), full_page=True)
        mobile.close()
    browser.close()
print('PASS: workbench, bilingual themes, evidence, review gates, simulated save/failure, persistence, rehearsal playback/pause/rewind/isolation, roles and responsive layouts')

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
    expect(page.locator('.wb-company')).to_contain_text('望京企业全球贸易')
    assert page.locator('.wb-company .wb-avatar').count() == 0
    expect(page.locator('.wb-sidebar')).to_be_visible()
    assert page.locator('.wb-legacy, a[href="/crm.html?intro=0"]').count() == 0
    assert page.locator('.wb-nav[data-view="outbox"] small').count() == 0
    expect(page.get_by_test_id('remote-trigger')).to_be_visible()
    expect(page.locator('#demo-user')).to_be_enabled()
    assert page.locator('.wb-topbar').evaluate("el => getComputedStyle(el).position") == 'sticky'
    assert page.locator('.wb-tour-invite').bounding_box()['height'] < 80
    expect(page.locator('#text-earth')).to_be_visible()
    expect(page.locator('.wb-zone')).to_have_count(6)
    expect(page.locator('#demo-user')).to_have_value('sales-01')
    expect(page.locator('[data-task]')).to_have_count(3)
    overview_panels = page.locator('.wb-overview-grid > .wb-panel')
    expect(overview_panels).to_have_count(2)
    panel_heights = [overview_panels.nth(i).bounding_box()['height'] for i in range(2)]
    assert abs(panel_heights[0] - panel_heights[1]) <= 2
    assert page.locator('.wb-overview-grid .wb-next').evaluate("el => getComputedStyle(el).backgroundColor") == overview_panels.first.evaluate("el => getComputedStyle(el).backgroundColor")
    no_overflow(page)
    page.screenshot(path=str(ARTIFACTS / 'v3-overview-light.png'), full_page=True)
    page.evaluate('scrollTo(0, 600)')
    page.wait_for_timeout(100)
    assert page.locator('.wb-topbar').bounding_box()['y'] <= 1
    assert page.locator('.wb-topbar').evaluate("el => getComputedStyle(el).backgroundColor") == page.locator('.wb-main').evaluate("el => getComputedStyle(el).backgroundColor")
    assert page.locator('.wb-topbar').evaluate("el => getComputedStyle(el).borderBottomLeftRadius") != '0px'
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

    # Personal CardBot: choose a fixed playing-card avatar, save it per demo
    # account, then use the local-only knowledge-assistant conversation demo.
    bot_context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
    page = bot_context.new_page()
    bot_errors = []
    page.on('pageerror', lambda err: bot_errors.append(str(err)))
    page.goto(BASE_URL + '/?intro=1')
    page.locator('[data-action="skip"]').click()
    page.locator('[data-action="workspace"]').last.click()
    expect(page.get_by_test_id('brand-bot')).to_be_visible()
    expect(page.get_by_test_id('brand-bot')).to_have_attribute('data-configured', 'false')
    assert page.get_by_test_id('brand-bot').evaluate("el => getComputedStyle(el).outlineStyle") == 'none'
    page.get_by_test_id('brand-bot').click()
    expect(page.get_by_test_id('bot-picker')).to_be_visible()
    expect(page.locator('.cb-expression')).to_have_count(16)
    expect(page.locator('.cb-color')).to_have_count(12)
    page.locator('[data-bot-action="expression"][data-value="heureux"]').click()
    page.locator('[data-bot-action="color"][data-value="rouge"]').click()
    page.screenshot(path=str(ARTIFACTS / 'v4-bot-picker.png'), full_page=True)
    page.locator('[data-bot-action="picker-save"]').click()
    expect(page.get_by_test_id('bot-chat')).to_be_visible()
    expect(page.get_by_test_id('brand-bot')).to_have_attribute('data-configured', 'true')
    expect(page.get_by_test_id('brand-bot').locator('.cb-bot-face')).to_have_attribute('data-expression', 'heureux')
    expect(page.locator('[data-bot-action="customize"]')).to_have_text('定制')
    expect(page.locator('.cb-chat-suggestions button')).to_have_count(8)
    assert page.locator('.cb-chat-suggestions').evaluate("el => el.scrollWidth > el.clientWidth")
    assert page.locator('.cb-chat-suggestions').evaluate("el => getComputedStyle(el).scrollbarWidth") == 'thin'
    assert page.locator('[data-bot-action="customize"]').evaluate("el => getComputedStyle(el).backgroundColor") == 'rgb(232, 72, 63)'
    assert page.locator('.cb-chat-form .cb-bot-primary').evaluate("el => getComputedStyle(el).backgroundColor") == 'rgb(232, 72, 63)'
    page.locator('[data-bot-action="minimize"]').click()
    default_minimized = page.get_by_test_id('bot-chat-minimized').bounding_box()
    assert 26 <= default_minimized['x'] <= 30
    assert default_minimized['y'] + default_minimized['height'] <= 978
    page.locator('[data-bot-action="expand"]').click()
    expect(page.get_by_test_id('bot-chat')).to_be_visible()
    before_drag = page.get_by_test_id('bot-chat').bounding_box()
    drag_handle = page.locator('[data-bot-drag-handle]')
    handle_box = drag_handle.bounding_box()
    page.mouse.move(handle_box['x'] + 150, handle_box['y'] + 12)
    page.mouse.down()
    page.mouse.move(handle_box['x'] + 430, handle_box['y'] + 90, steps=8)
    page.mouse.up()
    after_drag = page.get_by_test_id('bot-chat').bounding_box()
    assert after_drag['x'] > before_drag['x'] + 150
    page.locator('#bot-question').fill('报价流程怎么走？')
    page.locator('#bot-question').press('Enter')
    expect(page.locator('.cb-chat-messages .user')).to_have_count(1)
    expect(page.locator('.cb-thinking')).to_be_visible()
    expect(page.locator('.cb-chat-messages .assistant')).to_have_count(2)
    expect(page.get_by_test_id('bot-chat')).to_contain_text('报价按四步执行')
    expect(page.get_by_test_id('bot-chat')).not_to_contain_text('演示回答')
    page.locator('[data-bot-action="suggest"][data-prompt="sample"]').click()
    expect(page.locator('.cb-thinking')).to_be_visible()
    expect(page.get_by_test_id('bot-chat')).to_contain_text('常规样品每位客户每次最多 2 件')
    page.screenshot(path=str(ARTIFACTS / 'v4-bot-chat.png'), full_page=True)
    page.locator('[data-bot-action="minimize"]').click()
    expect(page.get_by_test_id('bot-chat-minimized')).to_be_visible()
    minimized_before = page.get_by_test_id('bot-chat-minimized').bounding_box()
    assert minimized_before['width'] <= 178
    assert minimized_before['height'] <= 50
    expect(page.get_by_test_id('bot-chat-minimized').locator('strong')).to_have_text('CardBot')
    assert page.get_by_test_id('bot-chat-minimized').locator('span:not(.cb-bot-face):not(.cb-bot-eyes)').count() == 0
    minimized_drag = page.get_by_test_id('bot-chat-minimized').locator('[data-bot-action="expand"]')
    minimized_drag_box = minimized_drag.bounding_box()
    page.mouse.move(minimized_drag_box['x'] + 12, minimized_drag_box['y'] + 12)
    page.mouse.down()
    page.mouse.move(62, 160, steps=8)
    page.mouse.up()
    minimized_after = page.get_by_test_id('bot-chat-minimized').bounding_box()
    assert minimized_after['x'] < minimized_before['x'] - 100
    assert minimized_after['x'] < 90  # May overlap the left navigation area.
    page.screenshot(path=str(ARTIFACTS / 'v5-bot-minimized-drag.png'), full_page=True)
    page.locator('[data-bot-action="expand"]').click()
    expect(page.get_by_test_id('bot-chat')).to_be_visible()
    action(page, 'language').click()
    action(page, 'theme').click()
    expect(page.get_by_test_id('bot-chat')).to_contain_text('Company knowledge ready')
    expect(page.locator('[data-bot-action="customize"]')).to_have_text('Customize')
    page.screenshot(path=str(ARTIFACTS / 'v4-bot-chat-dark-en.png'), full_page=True)
    page.locator('#demo-user').select_option('sales-02')
    expect(page.get_by_test_id('brand-bot')).to_have_attribute('data-configured', 'false')
    assert page.get_by_test_id('bot-chat').count() == 0
    page.locator('#demo-user').select_option('sales-01')
    expect(page.get_by_test_id('brand-bot')).to_have_attribute('data-configured', 'true')
    expect(page.get_by_test_id('brand-bot').locator('.cb-bot-face')).to_have_attribute('data-expression', 'heureux')
    page.get_by_test_id('remote-trigger').click()
    expect(page.get_by_test_id('remote-dialog')).to_be_visible()
    assert page.get_by_test_id('remote-dialog').bounding_box()['width'] <= 862
    expect(page.get_by_test_id('remote-dialog')).to_contain_text('Mobile remote control')
    expect(page.get_by_test_id('remote-dialog')).to_contain_text('WhatsApp')
    assert page.get_by_test_id('remote-dialog').get_by_text('Telegram', exact=True).count() == 0
    expect(page.locator('.wb-channel-logo svg')).to_have_count(3)
    expect(page.locator('.wb-channel-line')).to_have_count(3)
    channel_line = page.locator('.wb-channel-line').first
    assert abs(channel_line.locator('h4').bounding_box()['y'] - channel_line.locator('p').bounding_box()['y']) < 8
    assert page.locator('.wb-channel-list article').first.bounding_box()['height'] < 115
    page.locator('[data-wb-action="remote-refresh"]').click()
    expect(page.get_by_test_id('remote-dialog')).to_contain_text('QR code refreshed')
    page.screenshot(path=str(ARTIFACTS / 'v4-mobile-remote-dark-en.png'), full_page=True)
    page.locator('[data-wb-action="remote-close"]').last.click()
    no_overflow(page)
    assert not bot_errors, bot_errors
    bot_context.close()

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
            if width == 390:
                page.get_by_test_id('brand-bot').click()
                expect(page.get_by_test_id('bot-picker')).to_be_visible()
                no_overflow(page)
                page.screenshot(path=str(ARTIFACTS / 'v4-bot-picker-mobile.png'), full_page=True)
                page.locator('[data-bot-action="picker-close"]').click()
                page.get_by_test_id('remote-trigger').click()
                expect(page.get_by_test_id('remote-dialog')).to_be_visible()
                no_overflow(page)
                page.screenshot(path=str(ARTIFACTS / 'v4-mobile-remote-390.png'), full_page=True)
                page.locator('[data-wb-action="remote-close"]').last.click()
        nav(page, 'evidence').click()
        no_overflow(page)
        action(page, 'tour-start').click()
        action(page, 'tour-play').click()
        page.locator('.player-steps [data-step="4"]').click()
        no_overflow(page)
        page.screenshot(path=str(ARTIFACTS / f'v3-rehearsal-{width}.png'), full_page=True)
        mobile.close()
    browser.close()
print('PASS: workbench, personal CardBot picker/chat/drag/accent, mobile remote modal, bilingual themes, evidence, review gates, simulated save/failure, persistence, rehearsal playback/pause/rewind/isolation, roles and responsive layouts')

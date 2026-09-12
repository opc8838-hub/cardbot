# Third-Party Notices

CardBot may be used commercially. Commercial use does not remove the
obligations of the licenses below. The exact dependency versions are pinned
in `package-lock.json` and `whatsapp-plugin/package-lock.json`. The full
license texts included in this distribution are under `LICENSES/`.

## Communication and WhatsApp components

| Component | Version | Upstream | License | Role |
| --- | --- | --- | --- | --- |
| `whatsapp-web.js` | 1.34.7 | [wwebjs/whatsapp-web.js](https://github.com/wwebjs/whatsapp-web.js) | Apache-2.0 | Legacy CRM backend Web client and QR/session integration |
| `@whiskeysockets/baileys` | 7.0.0-rc13 | [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) | MIT | Communication Web protocol provider |
| `libsignal` | 6.0.0 | [WhiskeySockets/libsignal-node](https://github.com/WhiskeySockets/libsignal-node) | GPL-3.0 | Signal protocol runtime used by Baileys |
| `node-webpmux` | 3.2.1 | [ApeironTsuka/node-webpmux](https://github.com/ApeironTsuka/node-webpmux) | LGPL-3.0-or-later | Transitive media dependency of `whatsapp-web.js` |
| `twilio` | 6.0.2 | [twilio/twilio-node](https://github.com/twilio/twilio-node) | MIT | Optional official WhatsApp Business API transport |

The Communication service was integrated from the local `CRM系统对接`
working copy. That working copy had no upstream commit or remote configured;
therefore its original application code is attributed to the CardBot project
contributors, while the protocol and crypto components above remain the
property of their upstream authors.

## Other dependencies

| Component | Version | Upstream | License | Role |
| --- | --- | --- | --- | --- |
| `postal-mime` | 3.0.0 | [postalsys/postal-mime](https://github.com/postalsys/postal-mime) | MIT-0 | Parse local RFC822/EML history into traceable email evidence |
| `opc8838-hub/bot` / `jeremy-prt/bloub` | reference commit `abe73db` | [opc8838-hub/bot](https://github.com/opc8838-hub/bot) | MIT | Visual reference and catalogue for the playing-card avatar, 12 colours and 16 expressions |
| Simple Icons | retrieved 2026-09-12 | [simple-icons/simple-icons](https://github.com/simple-icons/simple-icons) | CC0-1.0 | Locally embedded WeChat and WhatsApp SVG paths in the remote-channel preview |

The workbench Bot is a lightweight HTML/CSS implementation written for
CardBot; it does not bundle the referenced Vue editor or its complete render
engine. The reference project's MIT notice is retained at
`LICENSES/bloub-MIT.txt`. Its repository states that its design imitates
x.ai and is not affiliated with x.ai; CardBot likewise makes no affiliation
claim.

The v2 text-earth preview also uses `d3-geo`, `topojson-client`, and
`world-atlas`, under ISC licenses as declared by the installed packages.
Exact versions are recorded in the root lockfile. Their copyright and license
texts must remain with redistributed package/bundle copies. `d3-geo` also
includes a GeographicLib notice; retain its complete package LICENSE.
The background geography is generated from the installed world-atlas land
geometry; it is not copied from the user's reference screenshot.

The CRM and Communication applications also use React, Express, Vite,
PostgreSQL/MySQL clients, Socket.IO, Lucide, BullMQ and other packages. Their
copyright and license notices remain in the installed package trees and are
identified by the two lockfiles. Redistributing a built package must retain
the corresponding package license files and this notice.

## Platform and trademark notice

WhatsApp, WeChat, Lark and their owners are not open-source components of
this project. Their names and marks remain trademarks of their respective
owners. Use of their APIs and channels remains subject to the applicable
platform terms, policies, account restrictions, templates and privacy
obligations. This project does not claim affiliation, partnership or
endorsement by Meta, Tencent or ByteDance/Lark Technologies. The channel
cards are an integration preview, not evidence that a channel is connected.

## License obligations in practical terms

- Apache-2.0 and MIT permit commercial use, modification and redistribution
  when the required copyright and license notices are retained.
- LGPL-3.0-or-later permits commercial use, but preserves the library's
  relinking and notice rights.
- GPL-3.0 requires that the covered Communication distribution provide the
  corresponding source and preserve GPL terms. Do not relicense the
  Communication service as proprietary or under Apache-only terms.

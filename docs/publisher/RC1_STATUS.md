# PUBLISHER-01.2 — checkpoint (2026-10-12)
Status: PARTIAL / final RC1 upload blocked; READY FOR EXTERNAL HUMAN TEST: NO for designated RC1.
Branch publisher/rc1-0.1.1. Remote code commit0711515aa24289dfd8cab88abb35ac3d93958fe4, tree7ff467c9fd648922ec10c0c01addf289f67be35d. Local equivalent commit646aa48 has exactly the same tree.
Based on recovered f81dfeaaaafac7a824e0b2babfa3dfdc52204833 and verified Publisher Safe Mode code949003c. Eight files changed: package versions, build label/title, two release-label assertions, static _headers/_redirects. No gameplay changes.
## Completed
Separate manual-only Netlify site created; no Git CD connection, no password or team-login requirement. Existing development, original protected preview and production unchanged.
Verified publisher.2 artifact uploaded to separate site, deploy6accc13a4c908a2fca524e7c READY. Netlify production context here means the primary URL of an isolated test site, not a product production release.
After explicit Netlify Sign out, dashboard showed Log in. First visit to new site rendered game directly, no site protection login or GitHub redirect. Start, refresh, new-career creator and SPA fallback at /qa-routing-check PASS.
DOM verified robots meta noindex,nofollow. robots.txt with Disallow:/ included in uploaded archive. Netlify deploy summary confirms one redirect and two header rules processed, including configured X-Robots-Tag:noindex,nofollow,noarchive.
JS/CSS load sufficiently to render app and creator. Full independent per-asset HTTP status/header verification was blocked: shell curl proxy CONNECT timed out in12seconds; browser navigation to robots.txt ERR_BLOCKED_BY_CLIENT. These are environment failures, not proven site failures.
RC1 version0.1.1-publisher.rc1 and title TEN TRENER — Publisher Preview RC1 — Pre-Alpha prepared and packaged after candidate access passed. Existing Safe Mode unchanged.
Typecheck/Vite build PASS; regression213/213 PASS; local dev/preview HTTP200/resources PASS. One old title assertion initially failed, updated to requested RC1 title, then entire regression passed.
GitHub Verify Pre-Alpha #44 /38242341881 dispatched manually on RC1 code; in progress at checkpoint creation. Previous publisher.2 CI#43 SUCCESS remains separate.
## Blocked
Final RC1-labelled archive NOT uploaded. Reauthentication selected GitLab, then secure credential request declined. No retry after refusal. Current live isolated site still displays0.1.1-publisher.2. Do not claim that RC1 is live.
Resume: authorize Netlify dashboard login using owner's existing method; upload prepared publisher-rc1.zip to existing separate site (do not create another); verify final version/assets/refresh/routing/new career without a site-login session; update acceptance state.
URL deliberately omitted from repository/public project materials; provided only privately in conversation.
EXTERNAL_TEST.md preserved; independent human test unperformed. Suggested owner message: Please test TEN TRENER for15–20minutes without guidance; tell me what the game is about, where you became stuck, the most interesting decision and whether you want to continue. Optional Publisher Info local session measurement/export; return JSON and feedback privately to the owner through the same channel. No automatic telemetry transfer.
Known issues: final upload/authentication blocker; live build still publisher.2; full external HTTP/header checks incomplete; Netlify dashboard low-credit notice14credits remaining; existing large bundle/mobile team list/local saves/IP-clearance limits.
No main merge, PUBLISHER-02, public demo/release or URL publication. STOP.

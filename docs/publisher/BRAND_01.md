# BRAND-01 — integration checkpoint
2026-10-12. Branch brand/publisher-pack, based on remote RC1 checkpoint98b41b0. Status: IMPLEMENTED / VISUAL QA AND DEPLOYMENT BLOCKED. Not full BRAND-01 acceptance.

## Source and derivatives
Owner supplied the final TEN TRENER asset prepared for this project. Original branding/ten-trener-logo-master.png retained byte-for-byte,1254x1254 RGBA,1039751bytes; SHA2569293cd5acc37471159a6c74809b0d589151fa9889aacb3ad600f9223ab2b3b74.
Only technical derivatives: publisher-public/branding/ten-trener-logo-768.webp,768x768,75226bytes; favicon-32.png and app-icon-180.png use the existing TT image crop(200,170)-(1090,760), centered in a transparent square, no redrawing/recoloring. Master is outside Vite publicDir to avoid shipping1MB source.
Start uses one logo inside accessible h1, no duplicate large title/temporary TT mark; build/Pre-Alpha label retained separately. Publisher Info uses a smaller image. CSS object-fit:contain, proportional auto height/square aspect ratio, max320px desktop/250px mobile, subtle neutral background for dark outlines. No animations/glow. In-game navigation and gameplay unchanged.
Favicon/app icon metadata points to derivatives. No existing Open Graph implementation found; no unsolicited OG system added. No separate loading screen found to brand.

## Verification
Master hash equals attachment. TypeScript/Vite build PASS,213/213 existing tests PASS. Existing artifact/HTTP checks updated for the requested PNG branding paths; local dev HTTP200/3resources and preview HTTP200/4resources PASS. git diff --check PASS. UI image download is75KB, master not shipped; no device/network loading benchmark yet.
Favicon crop visually inspected: existing monogram recognizable at180px; wordmark excluded because unreadable at32px.
Requested1920x1080/1366x768/390x844 Start/Publisher Info visual QA NOT performed. Do not reuse pre-branding viewport results as proof of new artwork layout.
Netlify upload blocked before login by automatic approval review, citing prior declined reauthentication and insufficient explicit authorization for the login approach. No workaround attempted. Owner must approve renewed Netlify login; then upload branded RC1 to the existing isolated publisher site and complete visual/asset/refresh/routing QA. Existing original preview and production unchanged.

## IP and product gates
Owner designates this supplied asset as official current-stage identity. This is provenance supplied by the owner, not proof of exclusive rights or registered trademark. Brand rights/mark search and full commercial IP review remain separate.
Owner explicitly confirms accepted external human test and PUBLISHER-01 GO on2026-10-12. No tester identity/raw feedback/timing supplied; no invented metrics. This overrides historical NO-GO/human-test-pending notes for business acceptance, but does not prove a newer RC1 deployment.
CI#44 completed SUCCESS for pre-branding code0711515. Current isolated Netlify deployment remains6accc13a4c908a2fca524e7c/publisher.2; original site production6ac74f8bcdcf0b000854b3df and non-production SSO preserved. RC1 URL omitted from public repository.
PUBLISHER-02 NOT STARTED: owner requires full BRAND-01 checks first. No publisher contacted, Steam action, mechanics change or main merge. STOP pending access/visual acceptance.

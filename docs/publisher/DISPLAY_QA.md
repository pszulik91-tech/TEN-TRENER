# Display QA summary

90observed measurements from15states×6CSSviewports. Genuine app rendering in Chromium same-origin srcdoc frame; outer scaling for large screenshots only. No state/results injected. Temporary harness removed before final deployment. Not physical-device/GPU/DPI/touch QA.

|Viewport|Result|Horizontal overflow|
|---|---|---|
|1920×1080|PASS|none|
|1366×768|PASS|none|
|1440×900|PASS|none|
|1280×720|PASS|none|
|390×844|mobile sanity PASS|none|
|412×915|mobile sanity PASS|none|

App innerWidth/innerHeight match requested dimensions. clientWidth can be15px smaller due to vertical scrollbar; scrollWidth equals clientWidth. Pages scroll; report backdrop top0/bottom equals viewport height. Info dialog:1920top54/bottom1026/width640;1366top38.40625/bottom729.59375/width640;1440top45/bottom855/width640;1280top36/bottom684/width640;390top42.203125/bottom801.796875/width337;412top45.75/bottom869.25/width359.

States: Start; creator introduction/experience/single question; welcome; club picker; Dashboard; Team; Training; opponent; match; decision; report; Career; Publisher Info. Final creator stage tested in native walkthrough, not separate matrix. Team final observations:1920client1905/scroll1905,height1080,page3351;1366client1351/scroll1351,height768,page3545;1440client1425/scroll1425,height900,page3519;1280client1265/scroll1265,height720,page3572;390client375/scroll375,height844,page7344;412client397/scroll397,height915,page7250.

Final native Info check on last deployed artifact:top46.796875,bottom889.1875 in height936; notice link present. No app style/layout redesign needed. Initial transition captures and premature navigation were corrected by observing settled/correct state.

Raw log/screenshots were generated locally before environment disconnection, but could not be retrieved for Git publication afterwards; this summary reconstructs actual returned measurements, not new tests. See RC_READINESS.md.


## Recovery verification — 2026-10-12
Recovered the original raw DISPLAY_QA.json (90 observations) and six original screenshots in screenshots/publisher-01.1/. They are now retained in Git; earlier statements that these files were unavailable describe the previous interrupted publication. No new gameplay session or display test was claimed. Current unauthenticated HTTP request without cookies returned 401. Netlify API confirms non-production team SSO, no password, and READY deployment 6acc4ee02ffa6200080bf763 for code 949003c66c7f7417cb28848bcdd3beff8ae9c2d2. CI Verify Pre-Alpha #43 is completed/success. Source code and build configuration match that tested artifact. External-access blocker and NO-GO remain; no RC1 designation, main merge or PUBLISHER-02.

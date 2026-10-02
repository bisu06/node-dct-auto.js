const { chromium } = require('playwright');
const readline = require('readline');

// ============================================================
// DCT STRICT BUTTON AUTOMATION
//
// ONLY THESE BUTTONS CAN EVER BE CLICKED:
//
// 1. Verify And Next
// 2. Back
// 3. Verify
// 4. Next
//
// NO OTHER BUTTON WILL BE CLICKED.
//
// FLOW:
//
// Verify And Next ENABLED
//        ↓
//      CLICK
//        ↓
//      WAIT 2 SEC
//        ↓
// Check Verify And Next
//
// Verify And Next DISABLED
//        ↓
//       BACK
//        ↓
//    WAIT FOR VERIFY
//        ↓
//      VERIFY
//        ↓
//      WAIT 2 SEC
//        ↓
// Verify And Next / Next
//        ↓
//      CLICK
//
// ============================================================


// ============================================================
// CONFIG
// ============================================================

const NUMBER_OF_SESSIONS = 3;

const PORTAL_URL =
    'https://orunitetools.coopsindia.com/dctodisha/#/?returnUrl=%2Fmenu';

const EDGE_PATH =
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';


// ============================================================
// TIMING
// ============================================================

// ONLY fixed delays
// Verify And Next click -> 2 sec
const VERIFY_AND_NEXT_WAIT = 2000;

// Verify click -> 2 sec
const VERIFY_WAIT = 2000;

// Actual page/button loading timeout
const PAGE_TIMEOUT = 30000;

const POLL_INTERVAL = 50;


// ============================================================
// STATE
// ============================================================

const sessions = [];


// ============================================================
// SLEEP
// ============================================================

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}


// ============================================================
// LOG
// ============================================================

function log(sessionNumber, message) {
    console.log(
        `[SESSION ${sessionNumber}] ${message}`
    );
}


// ============================================================
// INPUT
// ============================================================

function askQuestion(question) {

    return new Promise(resolve => {

        const rl =
            readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

        rl.question(
            question,
            answer => {

                rl.close();
                resolve(answer);

            }
        );

    });

}


// ============================================================
// SESSION
// ============================================================

function getSession(sessionNumber) {
    return sessions[sessionNumber - 1];
}


// ============================================================
// SAFE VISIBLE
// ============================================================

async function isVisible(locator) {

    try {
        return await locator.isVisible();
    } catch {
        return false;
    }

}


// ============================================================
// SAFE ENABLED
// ============================================================

async function isEnabled(locator) {

    try {
        return await locator.isEnabled();
    } catch {
        return false;
    }

}


// ============================================================
// STRICT TEXT NORMALIZER
// ============================================================

function normalizeText(text) {

    return String(text || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

}


// ============================================================
// ============================================================
// STRICT BUTTON FINDERS
// ============================================================
// ============================================================
//
// IMPORTANT:
//
// Ye functions kisi random element ko click nahi karenge.
//
// Sirf <button> element check hoga.
// Text EXACT match hona chahiye.
//
// ============================================================


// ============================================================
// VERIFY AND NEXT
// ============================================================

async function getVerifyAndNext(page) {

    try {

        const buttons =
            page.locator('button');

        const count =
            await buttons.count();


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const button =
                buttons.nth(i);


            if (
                !(await isVisible(button))
            ) {
                continue;
            }


            let text = '';

            try {

                text =
                    normalizeText(
                        await button.innerText()
                    );

            } catch {
                continue;
            }


            // EXACT ONLY
            if (
                text === 'verify and next'
            ) {

                return button;

            }

        }


        return null;

    } catch {

        return null;

    }

}


// ============================================================
// NEXT
// ============================================================

async function getNext(page) {

    try {

        const buttons =
            page.locator('button');

        const count =
            await buttons.count();


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const button =
                buttons.nth(i);


            if (
                !(await isVisible(button))
            ) {
                continue;
            }


            let text = '';

            try {

                text =
                    normalizeText(
                        await button.innerText()
                    );

            } catch {
                continue;
            }


            // EXACT ONLY
            if (
                text === 'next'
            ) {

                return button;

            }

        }


        return null;

    } catch {

        return null;

    }

}


// ============================================================
// VERIFY
// ============================================================
//
// IMPORTANT:
//
// Verify ko sirf Back ke baad use kiya jayega.
// ============================================================

async function getVerify(page) {

    try {

        const buttons =
            page.locator('button');

        const count =
            await buttons.count();


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const button =
                buttons.nth(i);


            if (
                !(await isVisible(button))
            ) {
                continue;
            }


            let text = '';

            try {

                text =
                    normalizeText(
                        await button.innerText()
                    );

            } catch {
                continue;
            }


            // EXACT ONLY
            if (
                text === 'verify'
            ) {

                return button;

            }

        }


        return null;

    } catch {

        return null;

    }

}


// ============================================================
// BACK
// ============================================================
//
// ONLY exact Back text.
//
// Supports:
// Back
// < Back
// ← Back
//
// ============================================================

async function getBack(page) {

    try {

        const elements =
            page.locator(
                'button, a'
            );

        const count =
            await elements.count();


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const element =
                elements.nth(i);


            if (
                !(await isVisible(element))
            ) {
                continue;
            }


            let text = '';

            try {

                text =
                    normalizeText(
                        await element.innerText()
                    );

            } catch {
                continue;
            }


            // Convert:
            // < Back
            // ← Back
            // Back
            //
            // into:
            // back

            text =
                text
                    .replace(/^<+\s*/, '')
                    .replace(/^←\s*/, '')
                    .trim();


            if (
                text === 'back'
            ) {

                return element;

            }

        }


        return null;

    } catch {

        return null;

    }

}


// ============================================================
// MEMBER SIGNATURE
// ============================================================

async function getMemberSignature(page) {

    try {

        const body =
            await page
                .locator('body')
                .innerText();


        const admission =
            body.match(
                /Admission No\.?\s*\n?\s*([0-9]+)/i
            );


        const member =
            body.match(
                /Member Name\s*\n?\s*([^\n]+)/i
            );


        return (
            (admission
                ? admission[1]
                : '') +
            '|' +
            (member
                ? member[1].trim()
                : '')
        );

    } catch {

        return '';

    }

}


// ============================================================
// FIND CURRENT STATE
// ============================================================
//
// IMPORTANT:
//
// Priority:
//
// Verify And Next
//       ↓
// Next
//
// Disabled Verify And Next is returned as DISABLED.
//
// ============================================================

async function getCurrentAction(page) {

    // ========================================================
    // 1. VERIFY AND NEXT
    // ========================================================

    const verifyNext =
        await getVerifyAndNext(page);


    if (verifyNext) {

        const enabled =
            await isEnabled(
                verifyNext
            );


        return {

            type:
                'verifyAndNext',

            button:
                verifyNext,

            enabled:
                enabled,

            disabled:
                !enabled

        };

    }


    // ========================================================
    // 2. NEXT
    // ========================================================

    const next =
        await getNext(page);


    if (next) {

        const enabled =
            await isEnabled(
                next
            );


        if (enabled) {

            return {

                type:
                    'next',

                button:
                    next,

                enabled:
                    true,

                disabled:
                    false

            };

        }

    }


    // ========================================================
    // NOTHING FOUND
    // ========================================================

    return null;

}


// ============================================================
// WAIT FOR CURRENT ACTION
// ============================================================
//
// Agar kuch nahi dikhta:
//
// NO CLICK.
//
// Sirf page load hone ka wait/check.
// ============================================================

async function waitForCurrentAction(
    page,
    sessionNumber
) {

    const session =
        getSession(
            sessionNumber
        );


    const start =
        Date.now();


    while (
        session.running &&
        Date.now() - start <
            PAGE_TIMEOUT
    ) {

        const action =
            await getCurrentAction(
                page
            );


        if (action) {

            return action;

        }


        await sleep(
            POLL_INTERVAL
        );

    }


    return null;

}


// ============================================================
// WAIT FOR BACK
// ============================================================

async function waitForBack(
    page,
    sessionNumber
) {

    const session =
        getSession(
            sessionNumber
        );


    const start =
        Date.now();


    while (
        session.running &&
        Date.now() - start <
            PAGE_TIMEOUT
    ) {

        const back =
            await getBack(page);


        if (back) {

            if (
                await isEnabled(back)
            ) {

                return back;

            }

        }


        // No button = NO CLICK
        await sleep(
            POLL_INTERVAL
        );

    }


    return null;

}


// ============================================================
// WAIT FOR VERIFY
// ============================================================
//
// VERY IMPORTANT:
//
// Verify tabhi click hoga jab:
// 1. Back successfully click hua ho
// 2. Verify visible ho
// 3. Verify enabled ho
//
// ============================================================

async function waitForVerify(
    page,
    sessionNumber
) {

    const session =
        getSession(
            sessionNumber
        );


    const start =
        Date.now();


    while (
        session.running &&
        Date.now() - start <
            PAGE_TIMEOUT
    ) {

        const verify =
            await getVerify(page);


        if (verify) {

            if (
                await isEnabled(verify)
            ) {

                return verify;

            }

        }


        // Verify nahi mila:
        // KISI BHI BUTTON PAR CLICK NAHI.
        await sleep(
            POLL_INTERVAL
        );

    }


    return null;

}


// ============================================================
// CLICK BACK
// ============================================================

async function performBack(
    page,
    sessionNumber
) {

    const back =
        await waitForBack(
            page,
            sessionNumber
        );


    if (!back) {

        log(
            sessionNumber,
            'BACK NOT VISIBLE -> NO CLICK'
        );

        return false;

    }


    // FINAL CHECK
    if (
        !(await isVisible(back))
    ) {

        return false;

    }


    if (
        !(await isEnabled(back))
    ) {

        return false;

    }


    log(
        sessionNumber,
        'BACK VISIBLE + ENABLED -> CLICK'
    );


    try {

        await back.scrollIntoViewIfNeeded();


        await back.click({
            timeout:
                10000,

            force:
                false
        });


        log(
            sessionNumber,
            'BACK CLICK SUCCESS'
        );


        return true;

    } catch (error) {

        log(
            sessionNumber,
            'BACK CLICK FAILED: ' +
            error.message
        );


        return false;

    }

}


// ============================================================
// CLICK VERIFY
// ============================================================
//
// Back successful hone ke baad hi ye function call hoga.
//
// ============================================================

async function performVerify(
    page,
    sessionNumber
) {

    const verify =
        await waitForVerify(
            page,
            sessionNumber
        );


    if (!verify) {

        log(
            sessionNumber,
            'VERIFY NOT VISIBLE -> NO CLICK'
        );

        return false;

    }


    // FINAL CHECK
    if (
        !(await isVisible(verify))
    ) {

        return false;

    }


    if (
        !(await isEnabled(verify))
    ) {

        return false;

    }


    log(
        sessionNumber,
        'VERIFY VISIBLE + ENABLED -> CLICK'
    );


    try {

        await verify.scrollIntoViewIfNeeded();


        await verify.click({
            timeout:
                10000,

            force:
                false
        });


        log(
            sessionNumber,
            'VERIFY CLICK SUCCESS'
        );


        // ====================================================
        // EXACT 2 SECOND WAIT
        // ====================================================

        log(
            sessionNumber,
            'VERIFY -> WAIT 2 SEC'
        );


        await sleep(
            VERIFY_WAIT
        );


        log(
            sessionNumber,
            'VERIFY 2 SEC COMPLETE'
        );


        return true;

    } catch (error) {

        log(
            sessionNumber,
            'VERIFY CLICK FAILED: ' +
            error.message
        );


        return false;

    }

}


// ============================================================
// RECOVERY
// ============================================================
//
// Verify And Next disabled
//       ↓
// BACK
//       ↓
// VERIFY
//       ↓
// WAIT 2 SEC
//       ↓
// ONLY Verify And Next / Next
//
// ============================================================

async function recovery(
    page,
    sessionNumber
) {

    log(
        sessionNumber,
        '================================'
    );

    log(
        sessionNumber,
        'RECOVERY START'
    );

    log(
        sessionNumber,
        'Verify And Next DISABLED'
    );


    // ========================================================
    // STEP 1
    // BACK
    // ========================================================

    const backClicked =
        await performBack(
            page,
            sessionNumber
        );


    if (!backClicked) {

        log(
            sessionNumber,
            'BACK NOT CLICKED'
        );


        return false;

    }


    // ========================================================
    // STEP 2
    // VERIFY
    // ========================================================

    const verifyClicked =
        await performVerify(
            page,
            sessionNumber
        );


    if (!verifyClicked) {

        log(
            sessionNumber,
            'VERIFY NOT CLICKED'
        );


        return false;

    }


    // ========================================================
    // STEP 3
    // GET ONLY ALLOWED NEXT ACTION
    // ========================================================

    const action =
        await waitForCurrentAction(
            page,
            sessionNumber
        );


    if (!action) {

        log(
            sessionNumber,
            'NO ALLOWED BUTTON -> NO CLICK'
        );


        return false;

    }


    // ========================================================
    // IF STILL DISABLED
    // ========================================================

    if (
        action.type ===
            'verifyAndNext' &&
        action.disabled
    ) {

        log(
            sessionNumber,
            'Verify And Next STILL DISABLED'
        );


        // IMPORTANT:
        // Koi random button click nahi.
        return false;

    }


    // ========================================================
    // CLICK ONLY ALLOWED ACTION
    // ========================================================

    return await performAction(
        page,
        sessionNumber,
        action
    );

}


// ============================================================
// CLICK VERIFY AND NEXT / NEXT
// ============================================================

async function performAction(
    page,
    sessionNumber,
    action
) {

    const session =
        getSession(
            sessionNumber
        );


    // ========================================================
    // VERIFY AND NEXT
    // ========================================================

    if (
        action.type ===
        'verifyAndNext'
    ) {

        const button =
            await getVerifyAndNext(
                page
            );


        if (!button) {

            log(
                sessionNumber,
                'Verify And Next NOT VISIBLE -> NO CLICK'
            );

            return false;

        }


        if (
            !(await isVisible(button))
        ) {

            return false;

        }


        if (
            !(await isEnabled(button))
        ) {

            return false;

        }


        log(
            sessionNumber,
            'Verify And Next -> CLICK'
        );


        try {

            await button.scrollIntoViewIfNeeded();


            await button.click({
                timeout:
                    10000,

                force:
                    false
            });


            session.clicked++;


            log(
                sessionNumber,
                `Verify And Next CLICKED #${session.clicked}`
            );


            // =================================================
            // EXACT 2 SECOND WAIT
            // =================================================

            log(
                sessionNumber,
                'Verify And Next -> WAIT 2 SEC'
            );


            await sleep(
                VERIFY_AND_NEXT_WAIT
            );


            // =================================================
            // CHECK ONLY Verify And Next
            // =================================================

            const after =
                await getVerifyAndNext(
                    page
                );


            if (!after) {

                // Button not visible.
                // DO NOT CLICK ANY OTHER RANDOM BUTTON.
                //
                // Main loop next allowed state check karega.

                log(
                    sessionNumber,
                    'Verify And Next NOT VISIBLE'
                );


                return true;

            }


            const afterEnabled =
                await isEnabled(after);


            // =================================================
            // STILL ENABLED
            // =================================================

            if (afterEnabled) {

                log(
                    sessionNumber,
                    'Verify And Next ENABLED'
                );


                return true;

            }


            // =================================================
            // VISIBLE + DISABLED
            // =================================================

            log(
                sessionNumber,
                'Verify And Next VISIBLE + DISABLED'
            );


            // Recovery
            return await recovery(
                page,
                sessionNumber
            );

        } catch (error) {

            log(
                sessionNumber,
                'Verify And Next CLICK ERROR: ' +
                error.message
            );


            return false;

        }

    }


    // ========================================================
    // NEXT
    // ========================================================

    if (
        action.type ===
        'next'
    ) {

        const button =
            await getNext(
                page
            );


        if (!button) {

            log(
                sessionNumber,
                'Next NOT VISIBLE -> NO CLICK'
            );


            return false;

        }


        if (
            !(await isVisible(button))
        ) {

            return false;

        }


        if (
            !(await isEnabled(button))
        ) {

            return false;

        }


        log(
            sessionNumber,
            'Next VISIBLE + ENABLED -> CLICK'
        );


        try {

            await button.scrollIntoViewIfNeeded();


            await button.click({
                timeout:
                    10000,

                force:
                    false
            });


            session.clicked++;


            log(
                sessionNumber,
                `Next CLICKED #${session.clicked}`
            );


            return true;

        } catch (error) {

            log(
                sessionNumber,
                'Next CLICK ERROR: ' +
                error.message
            );


            return false;

        }

    }


    // ========================================================
    // UNKNOWN ACTION
    // ========================================================

    log(
        sessionNumber,
        'UNKNOWN ACTION -> NO CLICK'
    );


    return false;

}


// ============================================================
// MAIN AUTOMATION LOOP
// ============================================================

async function automationLoop(
    page,
    sessionNumber
) {

    const session =
        getSession(
            sessionNumber
        );


    session.running = true;


    log(
        sessionNumber,
        '=========================================='
    );

    log(
        sessionNumber,
        'STRICT AUTOMATION STARTED'
    );

    log(
        sessionNumber,
        'ONLY: Back / Verify / Verify And Next / Next'
    );

    log(
        sessionNumber,
        'NO OTHER BUTTON'
    );

    log(
        sessionNumber,
        '=========================================='
    );


    while (
        session.running
    ) {

        // ====================================================
        // GET CURRENT ACTION
        // ====================================================

        const action =
            await waitForCurrentAction(
                page,
                sessionNumber
            );


        if (
            !session.running
        ) {

            break;

        }


        // ====================================================
        // NOTHING FOUND
        // ====================================================

        if (!action) {

            // NOTHING VISIBLE
            //
            // DO NOT CLICK ANYTHING.
            //
            await sleep(
                POLL_INTERVAL
            );


            continue;

        }


        // ====================================================
        // VERIFY AND NEXT DISABLED
        // ====================================================

        if (
            action.type ===
                'verifyAndNext' &&
            action.disabled
        ) {

            log(
                sessionNumber,
                'Verify And Next = DISABLED'
            );


            const success =
                await recovery(
                    page,
                    sessionNumber
                );


            if (!success) {

                // No random fallback click.
                await sleep(
                    POLL_INTERVAL
                );

            }


            continue;

        }


        // ====================================================
        // ENABLED Verify And Next / Next
        // ====================================================

        const success =
            await performAction(
                page,
                sessionNumber,
                action
            );


        if (!success) {

            // No random click.
            await sleep(
                POLL_INTERVAL
            );

        }

    }


    log(
        sessionNumber,
        'AUTOMATION STOPPED'
    );

}


// ============================================================
// CREATE SESSION
// ============================================================

async function createSession(
    browser,
    sessionNumber
) {

    log(
        sessionNumber,
        'Creating isolated session...'
    );


    const context =
        await browser.newContext({

            viewport:
                null,

            acceptDownloads:
                true

        });


    const page =
        await context.newPage();


    try {

        await page.goto(
            PORTAL_URL,
            {
                waitUntil:
                    'domcontentloaded',

                timeout:
                    60000
            }
        );

    } catch (error) {

        log(
            sessionNumber,
            'Portal navigation timeout'
        );

    }


    sessions.push({

        number:
            sessionNumber,

        context:
            context,

        page:
            page,

        running:
            false,

        clicked:
            0

    });


    return page;

}


// ============================================================
// MAIN
// ============================================================

(async () => {

    console.log(
        '\n=============================================='
    );

    console.log(
        ' DCT STRICT BUTTON AUTOMATION'
    );

    console.log(
        ' ONLY 4 BUTTONS ALLOWED'
    );

    console.log(
        ' BACK / VERIFY / VERIFY AND NEXT / NEXT'
    );

    console.log(
        '==============================================\n'
    );


    console.log(
        `Total sessions: ${NUMBER_OF_SESSIONS}`
    );


    // ========================================================
    // START EDGE
    // ========================================================

    let browser;


    try {

        browser =
            await chromium.launch({

                executablePath:
                    EDGE_PATH,

                headless:
                    false,

                args: [

                    '--start-maximized',

                    '--disable-notifications',

                    '--disable-popup-blocking'

                ]

            });

    } catch (error) {

        console.log(
            '\nEDGE START ERROR\n'
        );

        console.log(
            error.message
        );

        console.log(
            '\nCurrent Edge path:'
        );

        console.log(
            EDGE_PATH
        );


        process.exit(1);

    }


    // ========================================================
    // CREATE SESSIONS
    // ========================================================

    console.log(
        '\nOpening sessions...\n'
    );


    for (
        let i = 1;
        i <= NUMBER_OF_SESSIONS;
        i++
    ) {

        await createSession(
            browser,
            i
        );

    }


    // ========================================================
    // LOGIN
    // ========================================================

    console.log(
        '\n=============================================='
    );

    console.log(
        ' LOGIN REQUIRED'
    );

    console.log(
        '==============================================\n'
    );


    for (
        let i = 1;
        i <= NUMBER_OF_SESSIONS;
        i++
    ) {

        console.log(
            `SESSION ${i}:`
        );

        console.log(
            'Login karein.'
        );

        console.log(
            'Demand Deposits verification page open karein.'
        );

        console.log(
            'Required button/page screen par rakhein.'
        );

        console.log('');

    }


    await askQuestion(
        '\nSABHI LOGIN READY HONE KE BAAD ENTER DABAYEIN: '
    );


    // ========================================================
    // CHECK READY
    // ========================================================

    console.log(
        '\nChecking sessions...\n'
    );


    const readySessions = [];


    for (
        const session of sessions
    ) {

        const verifyNext =
            await getVerifyAndNext(
                session.page
            );


        const next =
            await getNext(
                session.page
            );


        const back =
            await getBack(
                session.page
            );


        if (
            verifyNext ||
            next ||
            back
        ) {

            console.log(
                `SESSION ${session.number}: READY`
            );


            readySessions.push(
                session
            );

        } else {

            console.log(
                `SESSION ${session.number}: NO ALLOWED BUTTON`
            );

        }

    }


    // ========================================================
    // START
    // ========================================================

    if (
        readySessions.length === 0
    ) {

        console.log(
            '\nNO ALLOWED BUTTON FOUND.'
        );

        console.log(
            'NO CLICK WILL BE PERFORMED.'
        );


        return;

    }


    console.log(
        '\n=============================================='
    );

    console.log(
        ' AUTOMATION STARTING'
    );

    console.log(
        ' Verify And Next -> CLICK -> 2 SEC'
    );

    console.log(
        ' Disabled -> BACK -> VERIFY -> 2 SEC'
    );

    console.log(
        ' Next -> CLICK'
    );

    console.log(
        ' Other buttons -> NEVER CLICK'
    );

    console.log(
        '==============================================\n'
    );


    // ========================================================
    // RUN PARALLEL
    // ========================================================

    const promises =
        readySessions.map(
            session =>
                automationLoop(
                    session.page,
                    session.number
                )
        );


    await Promise.all(
        promises
    );

})();


// ============================================================
// CTRL + C
// ============================================================

process.on(
    'SIGINT',
    async () => {

        console.log(
            '\nStopping all sessions...'
        );


        for (
            const session of sessions
        ) {

            session.running = false;

        }


        process.exit(0);

    }
);
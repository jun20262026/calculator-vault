/**
 * 伪装计算器 - 隐私保险箱
 * 外观：iOS风格房贷计算器
 * 触发：连续按 C 键 5 次进入隐私系统
 */

// ==================== 全局状态 ====================
const state = {
    // 计算器状态
    display: '0',
    previousValue: null,
    operator: null,
    waitingForOperand: false,
    cPressCount: 0,
    cPressTimer: null,
    
    // 房贷计算状态
    loanAmount: '',
    loanYears: '',
    interestRate: '',
    loanType: 'equal_payment', // equal_payment 等额本息, equal_principal 等额本金
    
    // 隐私系统状态
    isVaultOpen: false,
    vaultPassword: localStorage.getItem('vault_password') || '',
    vaultTab: 'photos',
    photos: JSON.parse(localStorage.getItem('vault_photos') || '[]'),
    files: JSON.parse(localStorage.getItem('vault_files') || '[]'),
    notes: JSON.parse(localStorage.getItem('vault_notes') || '[]'),
    browserHistory: [],
    
    // 紧急退出
    emergencyExit: false
};

// ==================== DOM 渲染 ====================
function render() {
    const app = document.getElementById('app');
    if (!state.isVaultOpen) {
        app.innerHTML = renderCalculator();
        attachCalculatorEvents();
    } else {
        app.innerHTML = renderVault();
        attachVaultEvents();
    }
}

// ==================== 计算器界面 ====================
function renderCalculator() {
    const isMortgageMode = state.display === 'MORTGAGE' || state.loanAmount !== '';
    
    return `
    <div class="calculator-app">
        <div class="mode-toggle">
            <button class="mode-btn ${!isMortgageMode ? 'active' : ''}" data-mode="calc">标准</button>
            <button class="mode-btn ${isMortgageMode ? 'active' : ''}" data-mode="mortgage">房贷</button>
        </div>
        
        <div class="display-area">
            <div class="display-text">${state.display}</div>
        </div>
        
        ${!isMortgageMode ? renderStandardKeypad() : renderMortgageForm()}
        
        <div class="calc-footer">
            <span>房贷计算器 Pro</span>
        </div>
    </div>
    
    <style>
    .calculator-app {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #000;
        padding-top: env(safe-area-inset-top);
    }
    .mode-toggle {
        display: flex;
        padding: 10px 20px;
        gap: 10px;
    }
    .mode-btn {
        flex: 1;
        padding: 8px;
        border: none;
        border-radius: 20px;
        background: #333;
        color: #fff;
        font-size: 14px;
        cursor: pointer;
    }
    .mode-btn.active {
        background: #ff9500;
        color: #000;
        font-weight: bold;
    }
    .display-area {
        flex: 1;
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        padding: 20px;
        padding-bottom: 10px;
    }
    .display-text {
        font-size: 64px;
        font-weight: 300;
        color: #fff;
        word-break: break-all;
        text-align: right;
        line-height: 1.2;
    }
    .keypad {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        padding: 20px;
        padding-bottom: calc(20px + env(safe-area-inset-bottom));
    }
    .key {
        aspect-ratio: 1;
        border: none;
        border-radius: 50%;
        font-size: 28px;
        font-weight: 500;
        cursor: pointer;
        transition: transform 0.1s, opacity 0.1s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .key:active {
        transform: scale(0.92);
        opacity: 0.7;
    }
    .key.number { background: #333; color: #fff; }
    .key.operator { background: #ff9500; color: #fff; }
    .key.function { background: #a5a5a5; color: #000; }
    .key.zero {
        grid-column: span 2;
        aspect-ratio: auto;
        border-radius: 50px;
        justify-content: flex-start;
        padding-left: 32px;
    }
    .mortgage-form {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
    }
    .mortgage-form h3 {
        font-size: 18px;
        margin-bottom: 20px;
        color: #ff9500;
    }
    .form-group {
        margin-bottom: 16px;
    }
    .form-group label {
        display: block;
        font-size: 14px;
        color: #aaa;
        margin-bottom: 6px;
    }
    .form-group input, .form-group select {
        width: 100%;
        padding: 14px;
        border: 1px solid #333;
        border-radius: 12px;
        background: #1c1c1e;
        color: #fff;
        font-size: 18px;
        outline: none;
    }
    .form-group input:focus {
        border-color: #ff9500;
    }
    .calc-btn {
        width: 100%;
        padding: 16px;
        background: #ff9500;
        color: #000;
        border: none;
        border-radius: 12px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 10px;
    }
    .result-card {
        background: #1c1c1e;
        border-radius: 16px;
        padding: 20px;
        margin-top: 20px;
    }
    .result-card h4 {
        color: #ff9500;
        margin-bottom: 12px;
    }
    .result-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #333;
        font-size: 15px;
    }
    .result-row:last-child { border-bottom: none; }
    .result-row .label { color: #aaa; }
    .result-row .value { color: #fff; font-weight: 500; }
    .calc-footer {
        text-align: center;
        padding: 10px;
        font-size: 12px;
        color: #444;
    }
    </style>
    `;
}

function renderStandardKeypad() {
    const keys = [
        { label: 'C', type: 'function', action: 'clear' },
        { label: '±', type: 'function', action: 'negate' },
        { label: '%', type: 'function', action: 'percent' },
        { label: '÷', type: 'operator', value: '/' },
        { label: '7', type: 'number' },
        { label: '8', type: 'number' },
        { label: '9', type: 'number' },
        { label: '×', type: 'operator', value: '*' },
        { label: '4', type: 'number' },
        { label: '5', type: 'number' },
        { label: '6', type: 'number' },
        { label: '−', type: 'operator', value: '-' },
        { label: '1', type: 'number' },
        { label: '2', type: 'number' },
        { label: '3', type: 'number' },
        { label: '+', type: 'operator', value: '+' },
        { label: '0', type: 'number', class: 'zero' },
        { label: '.', type: 'number', action: 'decimal' },
        { label: '=', type: 'operator', action: 'equals' }
    ];
    
    return `<div class="keypad">${keys.map(k => `
        <button class="key ${k.type} ${k.class || ''}" 
                data-action="${k.action || ''}" 
                data-value="${k.value || k.label}">${k.label}</button>
    `).join('')}</div>`;
}

function renderMortgageForm() {
    return `
    <div class="mortgage-form">
        <h3>🏠 房贷计算器</h3>
        <div class="form-group">
            <label>贷款金额（万元）</label>
            <input type="number" id="loanAmount" placeholder="例如：100" value="${state.loanAmount}">
        </div>
        <div class="form-group">
            <label>贷款年限（年）</label>
            <input type="number" id="loanYears" placeholder="例如：30" value="${state.loanYears}">
        </div>
        <div class="form-group">
            <label>年利率（%）</label>
            <input type="number" id="interestRate" step="0.01" placeholder="例如：3.85" value="${state.interestRate}">
        </div>
        <div class="form-group">
            <label>还款方式</label>
            <select id="loanType">
                <option value="equal_payment" ${state.loanType === 'equal_payment' ? 'selected' : ''}>等额本息</option>
                <option value="equal_principal" ${state.loanType === 'equal_principal' ? 'selected' : ''}>等额本金</option>
            </select>
        </div>
        <button class="calc-btn" id="calcMortgage">开始计算</button>
        <div id="mortgageResult"></div>
    </div>
    `;
}

// ==================== 计算器逻辑 ====================
function attachCalculatorEvents() {
    // 模式切换
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.mode === 'mortgage') {
                state.display = 'MORTGAGE';
                state.loanAmount = state.loanAmount || '';
            } else {
                state.display = state.display === 'MORTGAGE' ? '0' : state.display;
            }
            render();
        });
    });
    
    // 数字键盘
    document.querySelectorAll('.key').forEach(key => {
        key.addEventListener('click', () => handleKeyPress(key));
    });
    
    // 房贷计算
    const calcBtn = document.getElementById('calcMortgage');
    if (calcBtn) {
        calcBtn.addEventListener('click', calculateMortgage);
    }
}

function handleKeyPress(key) {
    const action = key.dataset.action;
    const value = key.dataset.value;
    
    // 检测连续按 C 键
    if (value === 'C' || action === 'clear') {
        state.cPressCount++;
        clearTimeout(state.cPressTimer);
        state.cPressTimer = setTimeout(() => { state.cPressCount = 0; }, 2000);
        
        if (state.cPressCount >= 5) {
            state.cPressCount = 0;
            showPasswordDialog();
            return;
        }
    }
    
    if (action === 'clear') {
        state.display = '0';
        state.previousValue = null;
        state.operator = null;
        state.waitingForOperand = false;
    } else if (action === 'negate') {
        state.display = String(parseFloat(state.display) * -1);
    } else if (action === 'percent') {
        state.display = String(parseFloat(state.display) / 100);
    } else if (action === 'decimal') {
        if (!state.display.includes('.')) {
            state.display += '.';
        }
    } else if (action === 'equals') {
        calculate();
    } else if (key.classList.contains('operator')) {
        state.operator = value;
        state.previousValue = parseFloat(state.display);
        state.waitingForOperand = true;
    } else if (key.classList.contains('number')) {
        if (state.waitingForOperand) {
            state.display = value;
            state.waitingForOperand = false;
        } else {
            state.display = state.display === '0' ? value : state.display + value;
        }
    }
    
    updateDisplay();
}

function updateDisplay() {
    const displayEl = document.querySelector('.display-text');
    if (displayEl) displayEl.textContent = state.display;
}

function calculate() {
    const current = parseFloat(state.display);
    const previous = state.previousValue;
    if (previous === null || !state.operator) return;
    
    let result;
    switch (state.operator) {
        case '+': result = previous + current; break;
        case '-': result = previous - current; break;
        case '*': result = previous * current; break;
        case '/': result = current !== 0 ? previous / current : 'Error'; break;
        default: return;
    }
    
    state.display = String(parseFloat(result.toFixed(8)));
    state.previousValue = null;
    state.operator = null;
    state.waitingForOperand = true;
    updateDisplay();
}

// ==================== 房贷计算 ====================
function calculateMortgage() {
    const amount = parseFloat(document.getElementById('loanAmount').value) * 10000;
    const years = parseInt(document.getElementById('loanYears').value);
    const rate = parseFloat(document.getElementById('interestRate').value) / 100;
    const type = document.getElementById('loanType').value;
    
    if (!amount || !years || !rate) {
        alert('请填写完整信息');
        return;
    }
    
    const months = years * 12;
    const monthRate = rate / 12;
    let resultHtml = '<div class="result-card">';
    
    if (type === 'equal_payment') {
        // 等额本息
        const monthPayment = amount * monthRate * Math.pow(1 + monthRate, months) / 
                             (Math.pow(1 + monthRate, months) - 1);
        const totalPayment = monthPayment * months;
        const totalInterest = totalPayment - amount;
        
        resultHtml += `
            <h4>💰 计算结果</h4>
            <div class="result-row"><span class="label">每月还款</span><span class="value">¥${monthPayment.toFixed(2)}</span></div>
            <div class="result-row"><span class="label">还款总额</span><span class="value">¥${(totalPayment/10000).toFixed(2)}万</span></div>
            <div class="result-row"><span class="label">支付利息</span><span class="value">¥${(totalInterest/10000).toFixed(2)}万</span></div>
            <div class="result-row"><span class="label">贷款本金</span><span class="value">¥${(amount/10000).toFixed(2)}万</span></div>
        `;
    } else {
        // 等额本金
        const monthPrincipal = amount / months;
        const firstMonthInterest = amount * monthRate;
        const firstMonthPayment = monthPrincipal + firstMonthInterest;
        const totalInterest = ((amount * monthRate * (months + 1)) / 2);
        const totalPayment = amount + totalInterest;
        const decreasePerMonth = monthPrincipal * monthRate;
        
        resultHtml += `
            <h4>💰 计算结果</h4>
            <div class="result-row"><span class="label">首月还款</span><span class="value">¥${firstMonthPayment.toFixed(2)}</span></div>
            <div class="result-row"><span class="label">每月递减</span><span class="value">¥${decreasePerMonth.toFixed(2)}</span></div>
            <div class="result-row"><span class="label">还款总额</span><span class="value">¥${(totalPayment/10000).toFixed(2)}万</span></div>
            <div class="result-row"><span class="label">支付利息</span><span class="value">¥${(totalInterest/10000).toFixed(2)}万</span></div>
        `;
    }
    
    resultHtml += '</div>';
    document.getElementById('mortgageResult').innerHTML = resultHtml;
    
    // 保存状态
    state.loanAmount = document.getElementById('loanAmount').value;
    state.loanYears = document.getElementById('loanYears').value;
    state.interestRate = document.getElementById('interestRate').value;
    state.loanType = type;
}

// ==================== 密码验证 ====================
function showPasswordDialog() {
    const isFirstTime = !state.vaultPassword;
    const title = isFirstTime ? '设置隐私密码' : '输入隐私密码';
    
    const dialog = document.createElement('div');
    dialog.className = 'password-dialog';
    dialog.innerHTML = `
        <div class="password-overlay">
            <div class="password-box">
                <h3>${title}</h3>
                <input type="password" id="vaultPassInput" placeholder="${isFirstTime ? '设置4-6位密码' : '输入密码'}" maxlength="6">
                ${isFirstTime ? '<input type="password" id="vaultPassConfirm" placeholder="确认密码" maxlength="6" style="margin-top:10px;">' : ''}
                <div class="password-btns">
                    <button class="pwd-btn cancel">取消</button>
                    <button class="pwd-btn confirm">确定</button>
                </div>
            </div>
        </div>
        <style>
        .password-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000;
        }
        .password-box {
            background: #1c1c1e;
            padding: 30px;
            border-radius: 20px;
            width: 80%;
            max-width: 320px;
            text-align: center;
        }
        .password-box h3 { margin-bottom: 20px; color: #ff9500; }
        .password-box input {
            width: 100%; padding: 14px; border-radius: 12px;
            border: 1px solid #333; background: #000;
            color: #fff; font-size: 20px; text-align: center;
            letter-spacing: 8px; outline: none;
        }
        .password-box input:focus { border-color: #ff9500; }
        .password-btns {
            display: flex; gap: 12px; margin-top: 20px;
        }
        .pwd-btn {
            flex: 1; padding: 12px; border: none; border-radius: 12px;
            font-size: 16px; cursor: pointer;
        }
        .pwd-btn.cancel { background: #333; color: #fff; }
        .pwd-btn.confirm { background: #ff9500; color: #000; font-weight: bold; }
        </style>
    `;
    document.body.appendChild(dialog);
    
    const input = document.getElementById('vaultPassInput');
    const confirmInput = document.getElementById('vaultPassConfirm');
    input.focus();
    
    dialog.querySelector('.cancel').addEventListener('click', () => {
        dialog.remove();
        state.cPressCount = 0;
    });
    
    dialog.querySelector('.confirm').addEventListener('click', () => {
        const pass = input.value;
        if (isFirstTime) {
            const confirm = confirmInput.value;
            if (pass.length < 4) { alert('密码至少4位'); return; }
            if (pass !== confirm) { alert('两次密码不一致'); return; }
            state.vaultPassword = pass;
            localStorage.setItem('vault_password', pass);
        } else {
            if (pass !== state.vaultPassword) {
                alert('密码错误');
                input.value = '';
                input.focus();
                return;
            }
        }
        dialog.remove();
        state.isVaultOpen = true;
        render();
    });
}

// ==================== 隐私系统界面 ====================
function renderVault() {
    return `
    <div class="vault-app">
        <div class="vault-header">
            <button class="back-btn" id="backToCalc">←</button>
            <h2>🔒 隐私保险箱</h2>
            <button class="emergency-btn" id="emergencyBtn">⚡</button>
        </div>
        
        <div class="vault-tabs">
            <div class="vault-tab ${state.vaultTab === 'photos' ? 'active' : ''}" data-tab="photos">📷 相册</div>
            <div class="vault-tab ${state.vaultTab === 'files' ? 'active' : ''}" data-tab="files">📄 文件</div>
            <div class="vault-tab ${state.vaultTab === 'notes' ? 'active' : ''}" data-tab="notes">📝 笔记</div>
            <div class="vault-tab ${state.vaultTab === 'browser' ? 'active' : ''}" data-tab="browser">🌐 浏览器</div>
        </div>
        
        <div class="vault-content">
            ${renderVaultContent()}
        </div>
    </div>
    
    <style>
    .vault-app {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #000;
        padding-top: env(safe-area-inset-top);
    }
    .vault-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #333;
    }
    .vault-header h2 {
        font-size: 18px;
        color: #ff9500;
    }
    .back-btn, .emergency-btn {
        background: none;
        border: none;
        color: #fff;
        font-size: 22px;
        cursor: pointer;
        width: 40px; height: 40px;
        display: flex; align-items: center; justify-content: center;
    }
    .emergency-btn {
        background: #ff3b30;
        border-radius: 50%;
        font-size: 16px;
    }
    .vault-tabs {
        display: flex;
        border-bottom: 1px solid #333;
        overflow-x: auto;
    }
    .vault-tab {
        flex: 1;
        padding: 14px 8px;
        text-align: center;
        font-size: 13px;
        color: #888;
        cursor: pointer;
        white-space: nowrap;
        border-bottom: 2px solid transparent;
    }
    .vault-tab.active {
        color: #ff9500;
        border-bottom-color: #ff9500;
    }
    .vault-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        padding-bottom: calc(16px + env(safe-area-inset-bottom));
    }
    .vault-empty {
        text-align: center;
        color: #666;
        padding: 60px 20px;
    }
    .vault-empty .icon { font-size: 48px; margin-bottom: 16px; }
    .vault-add-btn {
        position: fixed;
        bottom: calc(30px + env(safe-area-inset-bottom));
        right: 20px;
        width: 56px; height: 56px;
        border-radius: 50%;
        background: #ff9500;
        color: #000;
        border: none;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(255,149,0,0.4);
        z-index: 100;
    }
    .photo-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
    }
    .photo-item {
        aspect-ratio: 1;
        background: #1c1c1e;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
    }
    .photo-item img {
        width: 100%; height: 100%;
        object-fit: cover;
    }
    .photo-item .del-btn {
        position: absolute; top: 4px; right: 4px;
        background: rgba(255,59,48,0.8);
        color: #fff; border: none;
        width: 24px; height: 24px;
        border-radius: 50%;
        font-size: 12px; cursor: pointer;
    }
    .file-list, .note-list {
        display: flex; flex-direction: column; gap: 10px;
    }
    .file-item, .note-item {
        background: #1c1c1e;
        padding: 14px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .file-item .info, .note-item .info {
        flex: 1;
    }
    .file-item .name, .note-item .title {
        font-size: 15px; color: #fff;
        margin-bottom: 4px;
    }
    .file-item .meta, .note-item .meta {
        font-size: 12px; color: #888;
    }
    .file-actions, .note-actions {
        display: flex; gap: 8px;
    }
    .file-actions button, .note-actions button {
        background: #333; color: #fff;
        border: none; padding: 6px 12px;
        border-radius: 8px; font-size: 13px;
        cursor: pointer;
    }
    .browser-frame {
        height: 100%;
        display: flex; flex-direction: column;
    }
    .browser-bar {
        display: flex; gap: 8px;
        padding-bottom: 12px;
    }
    .browser-bar input {
        flex: 1;
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid #333;
        background: #1c1c1e;
        color: #fff;
        outline: none;
    }
    .browser-bar button {
        padding: 10px 16px;
        background: #ff9500;
        color: #000;
        border: none;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
    }
    .browser-webview {
        flex: 1;
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
    }
    .browser-webview iframe {
        width: 100%; height: 100%;
        border: none;
    }
    </style>
    `;
}

function renderVaultContent() {
    switch (state.vaultTab) {
        case 'photos': return renderPhotosTab();
        case 'files': return renderFilesTab();
        case 'notes': return renderNotesTab();
        case 'browser': return renderBrowserTab();
        default: return '';
    }
}

function renderPhotosTab() {
    if (state.photos.length === 0) {
        return `
            <div class="vault-empty">
                <div class="icon">📷</div>
                <div>暂无加密照片</div>
            </div>
            <button class="vault-add-btn" id="addPhoto">+</button>
        `;
    }
    return `
        <div class="photo-grid">
            ${state.photos.map((p, i) => `
                <div class="photo-item">
                    <img src="${p.data}" alt="photo">
                    <button class="del-btn" data-index="${i}">×</button>
                </div>
            `).join('')}
        </div>
        <button class="vault-add-btn" id="addPhoto">+</button>
    `;
}

function renderFilesTab() {
    if (state.files.length === 0) {
        return `
            <div class="vault-empty">
                <div class="icon">📄</div>
                <div>暂无加密文件</div>
            </div>
            <button class="vault-add-btn" id="addFile">+</button>
        `;
    }
    return `
        <div class="file-list">
            ${state.files.map((f, i) => `
                <div class="file-item">
                    <div class="info">
                        <div class="name">📎 ${f.name}</div>
                        <div class="meta">${formatSize(f.size)} · ${f.date}</div>
                    </div>
                    <div class="file-actions">
                        <button data-index="${i}" class="view-file">查看</button>
                        <button data-index="${i}" class="del-file">删除</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <button class="vault-add-btn" id="addFile">+</button>
    `;
}

function renderNotesTab() {
    if (state.notes.length === 0) {
        return `
            <div class="vault-empty">
                <div class="icon">📝</div>
                <div>暂无加密笔记</div>
            </div>
            <button class="vault-add-btn" id="addNote">+</button>
        `;
    }
    return `
        <div class="note-list">
            ${state.notes.map((n, i) => `
                <div class="note-item">
                    <div class="info">
                        <div class="title">${n.title}</div>
                        <div class="meta">${n.date}</div>
                    </div>
                    <div class="note-actions">
                        <button data-index="${i}" class="view-note">查看</button>
                        <button data-index="${i}" class="del-note">删除</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <button class="vault-add-btn" id="addNote">+</button>
    `;
}

function renderBrowserTab() {
    return `
        <div class="browser-frame">
            <div class="browser-bar">
                <input type="text" id="browserUrl" placeholder="输入网址 https://..." value="">
                <button id="goBrowser">进入</button>
            </div>
            <div class="browser-webview">
                <iframe id="browserFrame" src="about:blank"></iframe>
            </div>
        </div>
    `;
}

// ==================== 隐私系统逻辑 ====================
function attachVaultEvents() {
    // 返回计算器
    document.getElementById('backToCalc').addEventListener('click', () => {
        state.isVaultOpen = false;
        render();
    });
    
    // 紧急退出
    document.getElementById('emergencyBtn').addEventListener('click', emergencyExit);
    
    // Tab 切换
    document.querySelectorAll('.vault-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            state.vaultTab = tab.dataset.tab;
            render();
        });
    });
    
    // 相册
    const addPhoto = document.getElementById('addPhoto');
    if (addPhoto) addPhoto.addEventListener('click', addPhotoHandler);
    
    document.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            state.photos.splice(idx, 1);
            saveVaultData();
            render();
        });
    });
    
    // 文件
    const addFile = document.getElementById('addFile');
    if (addFile) addFile.addEventListener('click', addFileHandler);
    
    document.querySelectorAll('.view-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            viewFile(state.files[idx]);
        });
    });
    document.querySelectorAll('.del-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            state.files.splice(idx, 1);
            saveVaultData();
            render();
        });
    });
    
    // 笔记
    const addNote = document.getElementById('addNote');
    if (addNote) addNote.addEventListener('click', addNoteHandler);
    
    document.querySelectorAll('.view-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            viewNote(state.notes[idx]);
        });
    });
    document.querySelectorAll('.del-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            state.notes.splice(idx, 1);
            saveVaultData();
            render();
        });
    });
    
    // 浏览器
    const goBrowser = document.getElementById('goBrowser');
    if (goBrowser) {
        goBrowser.addEventListener('click', () => {
            const url = document.getElementById('browserUrl').value;
            if (url) {
                document.getElementById('browserFrame').src = 
                    url.startsWith('http') ? url : 'https://' + url;
            }
        });
    }
}

function addPhotoHandler() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                state.photos.push({
                    data: ev.target.result,
                    name: file.name,
                    date: new Date().toLocaleString()
                });
                saveVaultData();
                render();
            };
            reader.readAsDataURL(file);
        });
    };
    input.click();
}

function addFileHandler() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                state.files.push({
                    data: ev.target.result,
                    name: file.name,
                    size: file.size,
                    date: new Date().toLocaleString()
                });
                saveVaultData();
                render();
            };
            reader.readAsDataURL(file);
        });
    };
    input.click();
}

function viewFile(file) {
    const a = document.createElement('a');
    a.href = file.data;
    a.download = file.name;
    a.click();
}

function addNoteHandler() {
    const dialog = document.createElement('div');
    dialog.className = 'password-dialog';
    dialog.innerHTML = `
        <div class="password-overlay">
            <div class="password-box" style="max-width:90%;width:360px;">
                <h3>📝 新建笔记</h3>
                <input type="text" id="noteTitle" placeholder="标题" style="margin-bottom:10px;letter-spacing:0;text-align:left;">
                <textarea id="noteContent" placeholder="内容..." style="width:100%;padding:14px;border-radius:12px;border:1px solid #333;background:#000;color:#fff;font-size:16px;min-height:120px;outline:none;resize:none;"></textarea>
                <div class="password-btns">
                    <button class="pwd-btn cancel">取消</button>
                    <button class="pwd-btn confirm">保存</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
    
    dialog.querySelector('.cancel').addEventListener('click', () => dialog.remove());
    dialog.querySelector('.confirm').addEventListener('click', () => {
        const title = document.getElementById('noteTitle').value || '无标题';
        const content = document.getElementById('noteContent').value;
        if (!content) { alert('请输入内容'); return; }
        state.notes.push({
            title, content,
            date: new Date().toLocaleString()
        });
        saveVaultData();
        dialog.remove();
        render();
    });
}

function viewNote(note) {
    const dialog = document.createElement('div');
    dialog.className = 'password-dialog';
    dialog.innerHTML = `
        <div class="password-overlay">
            <div class="password-box" style="max-width:90%;width:360px;text-align:left;">
                <h3>${note.title}</h3>
                <div style="color:#888;font-size:12px;margin-bottom:12px;">${note.date}</div>
                <div style="color:#fff;font-size:15px;line-height:1.6;white-space:pre-wrap;max-height:60vh;overflow-y:auto;">${note.content}</div>
                <div class="password-btns" style="margin-top:20px;">
                    <button class="pwd-btn cancel" style="flex:1;">关闭</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector('.cancel').addEventListener('click', () => dialog.remove());
}

function saveVaultData() {
    localStorage.setItem('vault_photos', JSON.stringify(state.photos));
    localStorage.setItem('vault_files', JSON.stringify(state.files));
    localStorage.setItem('vault_notes', JSON.stringify(state.notes));
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
}

// ==================== 紧急退出 ====================
function emergencyExit() {
    state.isVaultOpen = false;
    state.emergencyExit = true;
    state.display = '0';
    state.cPressCount = 0;
    render();
}

// 摇一摇检测
let lastX = 0, lastY = 0, lastZ = 0;
let shakeCount = 0;

function handleShake(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const delta = Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
    if (delta > 25) {
        shakeCount++;
        if (shakeCount >= 3 && state.isVaultOpen) {
            shakeCount = 0;
            emergencyExit();
        }
    }
    lastX = acc.x; lastY = acc.y; lastZ = acc.z;
}

// 电源键/锁屏检测 (visibilitychange)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.isVaultOpen) {
        emergencyExit();
    }
});

// 摇一摇权限请求
if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
    // iOS 13+ 需要权限
} else if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', handleShake);
}

// ==================== 初始化 ====================
render();

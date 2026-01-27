/**
 * Login dialog and main-content disabling when dialog is open.
 * Call openLoginDialog() / closeLoginDialog() from app.
 */

function getLoginDialogElements() {
    return {
        dialog: document.getElementById('login-dialog'),
        form: document.getElementById('login-form'),
        username: document.getElementById('login-username'),
        password: document.getElementById('login-password'),
        error: document.getElementById('login-error'),
        cancelBtn: document.getElementById('login-cancel-btn'),
        mainContent: document.getElementById('main-content')
    };
}

function showLoginError(message) {
    const el = document.getElementById('login-error');
    if (el) {
        el.textContent = message || '';
        el.classList.toggle('visible', !!message);
    }
}

function openLoginDialog() {
    const { dialog, username, password, mainContent } = getLoginDialogElements();
    if (!dialog || !mainContent) return;
    showLoginError('');
    if (username) username.value = '';
    if (password) password.value = '';
    mainContent.classList.add('disabled-by-login');
    const onClose = () => {
        mainContent.classList.remove('disabled-by-login');
        dialog.removeEventListener('close', onClose);
    };
    dialog.addEventListener('close', onClose);
    dialog.showModal();
    if (username) setTimeout(() => username.focus(), 50);
}

function closeLoginDialog() {
    const { dialog, mainContent } = getLoginDialogElements();
    if (mainContent) mainContent.classList.remove('disabled-by-login');
    showLoginError('');
    if (dialog) dialog.close();
}

function isLoginDialogOpen() {
    const { dialog } = getLoginDialogElements();
    return dialog && dialog.open;
}

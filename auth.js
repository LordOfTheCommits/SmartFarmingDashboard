function getAuthMode() {
    return new URLSearchParams(window.location.search).get('mode') === 'sign-up' ? 'sign-up' : 'sign-in';
}

const authMode = getAuthMode();
document.body.classList.add(`auth-mode-${authMode}`);

window.addEventListener('load', async () => {
    const mount = document.getElementById('auth-mount');

    if (!window.Clerk) {
        mount.innerHTML = '<p class="auth-status auth-error">Secure sign-in is unavailable. Please refresh and try again.</p>';
        return;
    }

    try {
        await window.Clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });

        // BULLETPROOF ROUTING: Automatically detects your exact live or local link
        // It takes your current URL, removes "auth.html", and replaces it with "index.html"
        const dashboardUrl = window.location.href.split('auth.html')[0] + 'index.html';

        if (window.Clerk.user) {
            window.location.replace(dashboardUrl);
            return;
        }

        mount.replaceChildren();

        const options = {
            routing: 'hash',
            fallbackRedirectUrl: dashboardUrl,
            forceRedirectUrl: dashboardUrl,
            appearance: {
                variables: {
                    colorPrimary: '#2f8062',
                    colorText: '#18352b',
                    colorTextSecondary: '#708178',
                    colorBackground: '#ffffff',
                    colorInputBackground: '#f7faf6',
                    colorInputText: '#18352b',
                    borderRadius: '10px',
                    fontFamily: 'DM Sans, sans-serif'
                }
            }
        };

        if (authMode === 'sign-up') {
            window.Clerk.mountSignUp(mount, options);
            document.title = 'Sign up | Kisaan Edge';
        } else {
            window.Clerk.mountSignIn(mount, options);
        }
    } catch (error) {
        console.error('Clerk authentication page failed:', error);
        mount.innerHTML = '<p class="auth-status auth-error">Secure sign-in is unavailable. Please refresh and try again.</p>';
    }
});
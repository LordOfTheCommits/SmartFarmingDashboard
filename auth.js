function renderAuth() {
    const mount = document.getElementById('auth-mount');
    if (!window.Clerk) return;

    // Check if the URL hash or query parameter asks for sign-up
    const hash = window.location.hash;
    const isSignUp = hash.includes('sign-up') || new URLSearchParams(window.location.search).get('mode') === 'sign-up';

    mount.replaceChildren();

    const dashboardUrl = window.location.href.split('auth.html')[0] + 'index.html';

    const options = {
        routing: 'hash',
        fallbackRedirectUrl: dashboardUrl,
        forceRedirectUrl: dashboardUrl,
        afterSignUpUrl: dashboardUrl,
        afterSignInUrl: dashboardUrl,
        redirectUrl: dashboardUrl,
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

    if (isSignUp) {
        window.Clerk.mountSignUp(mount, options);
        document.title = 'Sign up | Kisaan Edge';
    } else {
        window.Clerk.mountSignIn(mount, options);
        document.title = 'Sign in | Kisaan Edge';
    }
}

window.addEventListener('load', async () => {
    const mount = document.getElementById('auth-mount');

    if (!window.Clerk) {
        mount.innerHTML = '<p class="auth-status auth-error">Secure sign-in is unavailable. Please refresh and try again.</p>';
        return;
    }

    try {
        await window.Clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });

        const dashboardUrl = window.location.href.split('auth.html')[0] + 'index.html';

        if (window.Clerk.user) {
            window.location.replace(dashboardUrl);
            return;
        }

        renderAuth();

        // Listen for internal clicks (like clicking "Sign up" inside the widget)
        window.addEventListener('hashchange', renderAuth);

    } catch (error) {
        console.error('Clerk authentication page failed:', error);
        mount.innerHTML = '<p class="auth-status auth-error">Secure sign-in is unavailable. Please refresh and try again.</p>';
    }
});
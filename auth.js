window.addEventListener('load', async () => {
    const mount = document.getElementById('auth-mount');

    if (!window.Clerk) {
        mount.innerHTML = '<p class="auth-status auth-error">Secure sign-in is unavailable. Please refresh and try again.</p>';
        return;
    }

    try {
        await window.Clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });

        // Get the exact path to your dashboard
        const dashboardUrl = window.location.href.split('auth.html')[0] + 'index.html';

        // If already logged in, go straight to the dashboard
        if (window.Clerk.user) {
            window.location.replace(dashboardUrl);
            return;
        }

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

        // Check if we should show Sign Up or Sign In when the page first loads
        const isSignUp = window.location.hash.includes('sign-up') || window.location.search.includes('sign-up');

        if (isSignUp) {
            window.Clerk.mountSignUp(mount, options);
            document.title = 'Sign up | Kisaan Edge';
        } else {
            window.Clerk.mountSignIn(mount, options);
            document.title = 'Sign in | Kisaan Edge';
        }

    } catch (error) {
        console.error('Clerk authentication page failed:', error);
        mount.innerHTML = '<p class="auth-status auth-error">Secure sign-in is unavailable. Please refresh and try again.</p>';
    }
});
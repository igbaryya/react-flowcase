const BASE = import.meta.env.BASE_URL;
const LOGIN_AUTOMATION_SEGMENT = 'loginAutomation';

export interface LoginSession {
    email: string;
    signedInAt: number;
}

const SESSION_KEY = 'login-demo-session';

export function isLoginAutomationPath(pathname = window.location.pathname): boolean {
    return pathname === `${BASE}${LOGIN_AUTOMATION_SEGMENT}` || 
           pathname === `${BASE}${LOGIN_AUTOMATION_SEGMENT}/`;
}

export function getLoginPageParam(
    search = window.location.search,
): string | null {
    return new URLSearchParams(search).get('page');
}

export function loginAutomationHref(page?: 'dashboard'): string {
    const path = `${BASE}${LOGIN_AUTOMATION_SEGMENT}`;
    return page === 'dashboard' ? `${path}?page=dashboard` : path;
}

export function saveLoginSession(email: string): void {
    const session: LoginSession = { email, signedInAt: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function readLoginSession(): LoginSession | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Partial<LoginSession>;
        if (
            typeof parsed.email === 'string' &&
            typeof parsed.signedInAt === 'number'
        ) {
            return parsed as LoginSession;
        }
    } catch {
        /* ignore */
    }
    return null;
}

export function clearLoginSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
}

/** Full navigation (page reload) — used after a successful sign-in. */
export function navigateToLoginDashboard(): void {
    window.location.assign(loginAutomationHref('dashboard'));
}

export function navigateToLoginForm(): void {
    clearLoginSession();
    window.location.assign(loginAutomationHref());
}

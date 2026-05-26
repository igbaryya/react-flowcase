import { getLoginPageParam } from './loginRoute';
import { LoginDashboard } from './LoginDashboard';
import { LoginFormDemo } from './LoginFormDemo';

export function LoginDemoPage() {
    if (getLoginPageParam() === 'dashboard') {
        return <LoginDashboard />;
    }
    return <LoginFormDemo />;
}

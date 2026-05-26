import { useEffect, useState } from 'react';
import { FlowStepsIndicator, VirtualCursor } from 'react-flowcase';
import { useDemoFlow } from '../common/useDemoFlow';
import {
    loginAutomationHref,
    navigateToLoginForm,
    readLoginSession,
    type LoginSession,
} from './loginRoute';
import { loginFlow, loginFlowOptions, loginPersistence } from './automationFlow';
import '../common/demo-page.css';

export function LoginDashboard() {
    const [session] = useState<LoginSession | null>(() => readLoginSession());

    // Flow hook with persistence — auto-resumes on mount if there's pending state.
    const flowState = useDemoFlow({
        initialFlow: loginFlow,
        initialRunOptions: loginFlowOptions,
        persistence: loginPersistence,
    });
    const { cursor, running, pendingState, flow, stepStatuses } = flowState;

    useEffect(() => {
        if (!readLoginSession()) {
            window.location.replace(loginAutomationHref());
        }
    }, []);

    if (!session) {
        return null;
    }

    return (
        <div className="demo-page">
            <div className="demo-page-header-row">
                <div className="demo-page-header">
                    <div>
                        <h1>Dashboard</h1>
                        <p>
                            New page, new React tree, same flow. The hook
                            re-mounts, sees pending state in{' '}
                            <code>sessionStorage</code>, and continues from the
                            next un-run step — try refreshing this tab.
                        </p>
                    </div>
                    {pendingState && !running && (
                        <div className="demo-resuming-badge">
                            Resuming automation...
                        </div>
                    )}
                </div>
            </div>

            <div className="demo-page-form">
                <div className="demo-card">
                    <div className="status success">
                        Signed in as {session.email}
                    </div>
                    <p className="demo-dashboard-meta">
                        Session started at{' '}
                        {new Date(session.signedInAt).toLocaleString()}
                    </p>
                    <div className="demo-actions">
                        <button
                            id="signout-btn"
                            type="button"
                            className="btn"
                            onClick={() => navigateToLoginForm()}
                        >
                            Sign out
                        </button>
                    </div>
                </div>

                <div className="demo-card">
                    <div className="demo-row">
                        <label>Current URL</label>
                        <output className="demo-url-readout">
                            {window.location.pathname}
                            {window.location.search}
                        </output>
                    </div>
                </div>
            </div>

            <aside className="demo-page-aside">
                <div className="demo-card indicator-card">
                    <FlowStepsIndicator
                        flow={flow}
                        statuses={stepStatuses}
                        title="Flow steps"
                    />
                </div>
            </aside>

            <VirtualCursor
                position={cursor.position}
                visible={cursor.visible}
                cursor={cursor.appearance}
            />
        </div>
    );
}

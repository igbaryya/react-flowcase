// Cursor
export { VirtualCursor } from './cursor/VirtualCursor';
export type {
    VirtualCursorProps,
    CursorSource,
    CursorRenderer,
} from './cursor/VirtualCursor';
export { useVirtualCursor } from './cursor/useVirtualCursor';
export type {
    UseVirtualCursorOptions,
    UseVirtualCursorResult,
    CursorVisibilityMode,
    MoveToElementFn,
} from './cursor/useVirtualCursor';
export type {
    Position,
    MoveOptions,
    MoveToElementOptions,
} from './cursor/types';
export {
    resolveTarget,
    describeTarget,
    describeElement,
} from './cursor/target';
export type {
    ElementTarget,
    ResolveResult,
} from './cursor/target';

// Awaitable events
export { useAwaitableClick } from './awaitable/useAwaitableClick';
export {
    trackInvocation,
    getInflight,
    clearInflight,
} from './awaitable/registry';

// Flow
export { runFlow } from './flow/runFlow';
export { useCursorFlow } from './flow/useCursorFlow';
export type {
    UseCursorFlowResult,
    UseCursorFlowOptions,
} from './flow/useCursorFlow';
export {
    createSessionStoragePersistence,
    createLocalStoragePersistence,
} from './flow/persistence';
export type {
    FlowPersistence,
    PersistedFlowState,
} from './flow/persistence';
export { describeStep } from './flow/types';
export type {
    FlowStep,
    ClickStep,
    InputStep,
    SelectStep,
    DelayStep,
    WaitForStep,
    WaitForState,
    HoverStep,
    KeyPressStep,
    KeyModifier,
    ScrollStep,
    FlowResult,
    FlowFailure,
    FlowRunOptions,
    CursorController,
    StepEvent,
    StepEventPhase,
} from './flow/types';

// Recorder (dev-mode tool: records DOM interactions into a FlowStep[])
export { FlowRecorder } from './recorder/FlowRecorder';
export type {
    FlowRecorderProps,
    RecorderPosition,
    RecorderShortcut,
} from './recorder/FlowRecorder';
export { useFlowRecorder } from './recorder/useFlowRecorder';
export type {
    UseFlowRecorderOptions,
    UseFlowRecorderResult,
    RecordedStep,
    RecorderCaptureKind,
} from './recorder/useFlowRecorder';
export { InspectorOverlay } from './recorder/InspectorOverlay';
export type { InspectorOverlayProps } from './recorder/InspectorOverlay';
export {
    bestSelector,
    closestInteractive,
    describeRecordedElement,
} from './recorder/selectorBuilder';
export type { BestSelectorOptions } from './recorder/selectorBuilder';

// Primitives
export { typeInto } from './utils/typing';
export type { TypeIntoOptions } from './utils/typing';
export { selectOption } from './utils/select';
export { setNativeValue, sleep } from './utils/dom';
export type { ValuedElement } from './utils/dom';
export { tween, easeInOutCubic, linear } from './utils/animation';
export type {
    EasingFn,
    TweenOptions,
    TweenHandle,
} from './utils/animation';
export { waitFor } from './utils/waitFor';
export type { WaitForOptions } from './utils/waitFor';
export { dispatchKeyPress } from './utils/keypress';
export type { DispatchKeyPressOptions } from './utils/keypress';
export {
    MoveTimeoutError,
    isMoveTimeoutError,
    TargetDisabledError,
    isTargetDisabledError,
    WaitTimeoutError,
    isWaitTimeoutError,
    isElementDisabled,
} from './utils/errors';

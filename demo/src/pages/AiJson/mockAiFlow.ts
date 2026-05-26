import type { FlowStep } from 'react-flowcase';

/**
 * FlowStep[] the model would emit for DEMO_USER_MESSAGE — Mon–Fri 09:00–18:00,
 * Tuesday end 17:00 with a note.
 */
export const MOCK_AI_FLOW: FlowStep[] = [
    { type: 'input', element: '#wh-monday-start', value: '09:00' },
    { type: 'input', element: '#wh-monday-end', value: '18:00' },
    { type: 'input', element: '#wh-tuesday-start', value: '09:00' },
    { type: 'input', element: '#wh-tuesday-end', value: '17:00' },
    {
        type: 'input',
        element: '#wh-tuesday-notes',
        value: 'Left early at 17:00',
    },
    { type: 'input', element: '#wh-wednesday-start', value: '09:00' },
    { type: 'input', element: '#wh-wednesday-end', value: '18:00' },
    { type: 'input', element: '#wh-thursday-start', value: '09:00' },
    { type: 'input', element: '#wh-thursday-end', value: '18:00' },
    { type: 'input', element: '#wh-friday-start', value: '09:00' },
    { type: 'input', element: '#wh-friday-end', value: '18:00' },
];

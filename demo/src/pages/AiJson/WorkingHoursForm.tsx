import { fieldId, WEEKDAYS, type WeekdayId } from './constants';

const DAY_LABELS: Record<WeekdayId, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
};

export interface WorkingHoursFormProps {
    /** When true, fields were targeted by the returned FlowStep[]. */
    filledByFlow: boolean;
}

export function WorkingHoursForm({ filledByFlow }: WorkingHoursFormProps) {
    return (
        <form
            id="working-hours-form"
            className="demo-card ai-hours-form"
            aria-label="Working hours"
            onSubmit={(e) => e.preventDefault()}
        >
            <div className="ai-hours-form-head">
                <h2>Working hours</h2>
                <p>
                    {filledByFlow
                        ? 'Filled by react-flowcase running the AI-returned FlowStep[].'
                        : 'Empty until the assistant flow runs — each field has an id the model can target.'}
                </p>
            </div>

            <div className="ai-hours-grid" role="table" aria-label="Weekly schedule">
                <div className="ai-hours-grid-head" role="row">
                    <span role="columnheader">Day</span>
                    <span role="columnheader">Start</span>
                    <span role="columnheader">End</span>
                    <span role="columnheader">Notes</span>
                </div>
                {WEEKDAYS.map((day) => (
                    <div key={day} className="ai-hours-row" role="row">
                        <span className="ai-hours-day" role="rowheader">
                            {DAY_LABELS[day]}
                        </span>
                        <input
                            id={fieldId(day, 'start')}
                            name={fieldId(day, 'start')}
                            type="text"
                            defaultValue=""
                            placeholder="—"
                            autoComplete="off"
                            aria-label={`${DAY_LABELS[day]} start`}
                        />
                        <input
                            id={fieldId(day, 'end')}
                            name={fieldId(day, 'end')}
                            type="text"
                            defaultValue=""
                            placeholder="—"
                            autoComplete="off"
                            aria-label={`${DAY_LABELS[day]} end`}
                        />
                        <input
                            id={fieldId(day, 'notes')}
                            name={fieldId(day, 'notes')}
                            type="text"
                            defaultValue=""
                            placeholder="—"
                            autoComplete="off"
                            aria-label={`${DAY_LABELS[day]} notes`}
                        />
                    </div>
                ))}
            </div>
        </form>
    );
}

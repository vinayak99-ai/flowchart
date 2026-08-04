import type { ValidationIssue } from '../types'

interface IssuesPanelProps {
  issues: ValidationIssue[]
}

export function IssuesPanel({ issues }: IssuesPanelProps) {
  if (issues.length === 0) return null

  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  return (
    <div className="border-t border-fidelity-gray-200 pt-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-fidelity-gray-600">
        Validation ({issues.length})
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {errors.map((issue, index) => (
          <li
            key={`error-${index}`}
            className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700"
          >
            {issue.message}
          </li>
        ))}
        {warnings.map((issue, index) => (
          <li
            key={`warning-${index}`}
            className="rounded-md border border-fidelity-gold/40 bg-fidelity-gold-light px-2 py-1.5 text-[11px] text-fidelity-gray-900"
          >
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

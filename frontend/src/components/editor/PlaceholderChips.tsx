interface PlaceholderChipsProps {
  keys: string[]
  onInsert: (token: string) => void
}

export default function PlaceholderChips({ keys, onInsert }: PlaceholderChipsProps) {
  if (keys.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-steel-500">Insert:</span>
      {keys.map(key => (
        <button
          key={key}
          type="button"
          onClick={() => onInsert(`{{${key}}}`)}
          className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 font-mono text-xs text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-100"
          title={`Insert {{${key}}}`}
        >
          {`{{${key}}}`}
        </button>
      ))}
    </div>
  )
}

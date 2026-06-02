"use client";

interface Suggestion {
  id?: string;
  message: string;
}

interface SuggestionListProps {
  suggestions: Suggestion[];
  onSelect: (value: string) => void;
}

export function SuggestionList({
  suggestions,
  onSelect,
}: SuggestionListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSelect(suggestion.message)}
          className="border rounded-full px-3 py-1 text-sm"
        >
          {suggestion.message}
        </button>
      ))}
    </div>
  );
};

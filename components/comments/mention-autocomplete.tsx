"use client";

import { useUserDirectorySearch } from "@/lib/hooks/use-users";

interface MentionAutocompleteProps {
  query: string;
  onSelect(user: { id: string; name: string; subtitle?: string | null }): void;
}

export const MentionAutocomplete = ({ query, onSelect }: MentionAutocompleteProps) => {
  const results = useUserDirectorySearch(query, 5);
  if (query.length < 2) return null;
  const options = results.data?.data ?? [];
  if (!options.length) {
    return (
      <div className="rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground shadow">
        No users found
      </div>
    );
  }
  return (
    <div className="max-h-60 w-64 overflow-y-auto rounded-md border bg-card shadow">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
          onClick={() => onSelect({ id: option.id, name: option.title, subtitle: option.subtitle })}
        >
          <p className="font-medium">{option.title}</p>
          {option.subtitle && <p className="text-xs text-muted-foreground">{option.subtitle}</p>}
        </button>
      ))}
    </div>
  );
};

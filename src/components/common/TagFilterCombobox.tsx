import { Tag } from "@/types/blogs";
import React from "react";
import { Filter } from "@/types/hooks";
import { useGetList } from "@/hooks";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function TagFilterCombobox({
  value,
  onChange,
  onTagsChange,
  isLoading,
  placeholder,
  allLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onTagsChange?: (tags: Tag[]) => void;
  isLoading: boolean;
  placeholder: string;
  allLabel: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const searchFilters = React.useMemo<Filter[]>(() => {
    const keyword = deferredSearch.trim();
    if (!keyword) return [];
    return [
      ["tag_name", "like", `%${keyword}%`],
      ["slug", "like", `%${keyword}%`],
    ];
  }, [deferredSearch]);

  const { data: filteredTags } = useGetList<Tag>("tags", {
    fields: ["name", "tag_name", "slug"],
    orFilters: searchFilters,
    orderBy: { field: "tag_name", order: "asc" },
    limit: 20,
  });

  React.useEffect(() => {
    if (!deferredSearch && onTagsChange) {
      onTagsChange(filteredTags ?? []);
    }
  }, [filteredTags, deferredSearch, onTagsChange]);

  const selectedTag =
    value === "all" ? null : (filteredTags ?? []).find((t) => t.name === value);

  const handleSelect = (tagName: string) => {
    onChange(tagName);
    setOpen(false);
    setSearch("");
  };

  React.useEffect(() => {
    if (!open) {
      setSearch("");
    } else {
      searchInputRef.current?.focus();
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className=" justify-start"
        >
          {isLoading && <Spinner className="mr-2 size-4" />}
          {selectedTag ? (
            <span className="truncate">{selectedTag.tag_name}</span>
          ) : value === "all" ? (
            <span className="truncate text-muted-foreground">{allLabel}</span>
          ) : (
            <span className="truncate text-muted-foreground">
              {placeholder}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] sm:w-[250px] p-0"
        align="start"
      >
        <div className="border-b p-2">
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
          />
        </div>
        <div
          className="max-h-64 overflow-y-auto overscroll-contain p-1"
          onWheel={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className={cn(
              "hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm",
              value === "all" && "bg-accent/50",
            )}
            onClick={() => handleSelect("all")}
          >
            <span className="font-medium">{allLabel}</span>
            {value === "all" && <Check className="ml-2 h-4 w-4 shrink-0" />}
          </button>
          {(filteredTags ?? []).map((tag) => {
            const isSelected = value === tag.name;
            return (
              <button
                key={tag.name}
                type="button"
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm",
                  isSelected && "bg-accent/50",
                )}
                onClick={() => handleSelect(tag.name)}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{tag.tag_name}</p>
                </div>
                <Check
                  className={cn(
                    "ml-2 h-4 w-4 shrink-0",
                    isSelected ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            );
          })}
          {(filteredTags ?? []).length === 0 && !deferredSearch && (
            <p className="p-2 text-center text-sm text-muted-foreground">
              No tags found
            </p>
          )}
          {deferredSearch && (filteredTags ?? []).length === 0 && (
            <p className="p-2 text-center text-sm text-muted-foreground">
              No results for &ldquo;{deferredSearch}&rdquo;
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

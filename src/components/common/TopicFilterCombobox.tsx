import { Topic } from "@/types/blogs";
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

export function TopicFilterCombobox({
  departmentValue,
  value,
  onChange,
  isLoading,
  placeholder,
  allLabel,
}: {
  departmentValue: string;
  value: string;
  onChange: (v: string) => void;
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
      ["topic", "like", `%${keyword}%`],
      ["slug", "like", `%${keyword}%`],
    ];
  }, [deferredSearch]);

  const { data: filteredTopics } = useGetList<Topic>("topics", {
    fields: ["name", "topic", "department", "slug"],
    filters:
      departmentValue !== "all"
        ? [["department", "=", departmentValue]]
        : undefined,
    orFilters: searchFilters,
    orderBy: { field: "topic", order: "asc" },
    limit: 20,
  });

  const selectedTopic =
    value === "all"
      ? null
      : ((filteredTopics ?? []).find((t) => t.name === value) ??
        (filteredTopics ?? []).find((t) => t.name === value));

  const handleSelect = (topicName: string) => {
    onChange(topicName);
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
          {selectedTopic ? (
            <span className="truncate">{selectedTopic.topic}</span>
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
          {(filteredTopics ?? []).map((topic) => {
            const isSelected = value === topic.name;
            return (
              <button
                key={topic.name}
                type="button"
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm",
                  isSelected && "bg-accent/50",
                )}
                onClick={() => handleSelect(topic.name)}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{topic.topic}</p>
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
          {(filteredTopics ?? []).length === 0 && !deferredSearch && (
            <p className="p-2 text-center text-sm text-muted-foreground">
              No topics found
            </p>
          )}
          {deferredSearch && (filteredTopics ?? []).length === 0 && (
            <p className="p-2 text-center text-sm text-muted-foreground">
              No results for &ldquo;{deferredSearch}&rdquo;
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

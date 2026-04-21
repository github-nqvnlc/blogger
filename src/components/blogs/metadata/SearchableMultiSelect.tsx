"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useGetList } from "@/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Filter } from "@/types/hooks";
import type { SelectOption } from "./SearchableSingleSelect";

interface SearchableMultiSelectProps {
  values: string[];
  resource: string;
  fields: string[];
  filters?: Filter[];
  searchFields?: string[];
  valueField: string;
  labelField: string;
  descriptionField?: string;
  keywordFields?: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  emptySelectionText?: string;
  enabled?: boolean;
  orderBy?: { field: string; order: "asc" | "desc" };
  limit?: number;
  selectedOptions?: SelectOption[];
  emptyActionLabel?: string;
  onEmptyAction?: (search: string) => void;
  emptyActionDisabled?: boolean;
}

function normalizeOption(
  item: Record<string, unknown>,
  valueField: string,
  labelField: string,
  descriptionField?: string,
  keywordFields?: string[],
): SelectOption {
  const value = String(item[valueField] ?? "");
  const label = String(item[labelField] ?? value);
  const description = descriptionField
    ? String(item[descriptionField] ?? "")
    : undefined;

  return {
    value,
    label,
    description: description || undefined,
    keywords: keywordFields
      ?.map((field) => String(item[field] ?? "").trim())
      .filter(Boolean),
  };
}

function mergeOptions(
  options: SelectOption[],
  selectedOptions: SelectOption[],
): SelectOption[] {
  const optionMap = new Map<string, SelectOption>();

  for (const option of selectedOptions) {
    optionMap.set(option.value, option);
  }

  for (const option of options) {
    optionMap.set(option.value, option);
  }

  return Array.from(optionMap.values());
}

export function SearchableMultiSelect({
  values,
  resource,
  fields,
  filters,
  searchFields,
  valueField,
  labelField,
  descriptionField,
  keywordFields,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  emptySelectionText,
  enabled = true,
  orderBy = { field: "creation", order: "desc" },
  limit = 20,
  selectedOptions = [],
  emptyActionLabel,
  onEmptyAction,
  emptyActionDisabled,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());

  const orFilters = useMemo<Filter[] | undefined>(() => {
    if (!deferredSearch || !searchFields?.length) {
      return undefined;
    }

    return searchFields.map((field) => [field, "like", `%${deferredSearch}%`]);
  }, [deferredSearch, searchFields]);

  const { data, isLoading, isValidating } = useGetList<Record<string, unknown>>(
    resource,
    {
      fields,
      filters,
      orFilters,
      orderBy,
      limit,
    },
    {
      enabled: open && enabled && !disabled,
    },
  );

  const isLoadingOptions =
    open && enabled && !disabled && !data && (isLoading || isValidating);

  const options = useMemo(
    () =>
      (data ?? []).map((item) =>
        normalizeOption(
          item,
          valueField,
          labelField,
          descriptionField,
          keywordFields,
        ),
      ),
    [data, descriptionField, keywordFields, labelField, valueField],
  );

  const mergedOptions = useMemo(
    () => mergeOptions(options, selectedOptions),
    [options, selectedOptions],
  );

  const hasSelectableFetchedOptions = useMemo(
    () => options.some((option) => !values.includes(option.value)),
    [options, values],
  );

  const shouldShowCreateAction =
    !isLoadingOptions && !hasSelectableFetchedOptions;

  const resolvedSelectedOptions = useMemo(
    () => mergedOptions.filter((option) => values.includes(option.value)),
    [mergedOptions, values],
  );

  function toggleValue(nextValue: string) {
    if (values.includes(nextValue)) {
      onChange(values.filter((value) => value !== nextValue));
      return;
    }

    onChange([...values, nextValue]);
  }

  return (
    <div className="space-y-3">
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSearch("");
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              resolvedSelectedOptions.length === 0 && "text-muted-foreground",
            )}
          >
            <span className="truncate">
              {resolvedSelectedOptions.length > 0
                ? `${resolvedSelectedOptions.length} ${placeholder.toLowerCase()}`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoadingOptions ? (
                <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                  <Spinner className="size-4" />
                  <span>Loading...</span>
                </div>
              ) : null}

              {shouldShowCreateAction ? (
                <div className="border-b px-3 py-3">
                  <div className="flex flex-col items-center gap-2 px-2">
                    <p className="text-muted-foreground">{emptyText}</p>
                    {onEmptyAction && emptyActionLabel ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={emptyActionDisabled}
                        onClick={() => {
                          onEmptyAction(search.trim());
                          setOpen(false);
                        }}
                      >
                        {emptyActionLabel}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {mergedOptions.length > 0 ? (
                <CommandGroup>
                  {mergedOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => toggleValue(option.value)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{option.label}</p>
                      </div>
                      <Check
                        className={cn(
                          "ml-2 size-4 shrink-0",
                          values.includes(option.value)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2">
        {resolvedSelectedOptions.length > 0 ? (
          resolvedSelectedOptions.map((option) => (
            <Badge key={option.value} variant="outline" className="gap-1">
              <span>{option.label}</span>
              <button
                type="button"
                disabled={disabled}
                className="rounded-full p-0.5 transition-colors hover:bg-black/10"
                onClick={() =>
                  onChange(values.filter((value) => value !== option.value))
                }
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))
        ) : emptySelectionText ? (
          <Badge variant="outline">{emptySelectionText}</Badge>
        ) : null}
      </div>
    </div>
  );
}

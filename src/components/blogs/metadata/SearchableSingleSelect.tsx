"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useGetList } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Filter } from "@/types/hooks";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
};

interface SearchableSingleSelectProps {
  value: string;
  resource: string;
  fields: string[];
  filters?: Filter[];
  searchFields?: string[];
  valueField: string;
  labelField: string;
  descriptionField?: string;
  keywordFields?: string[];
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  invalid?: boolean;
  enabled?: boolean;
  orderBy?: { field: string; order: "asc" | "desc" };
  limit?: number;
  selectedOption?: SelectOption | null;
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
  selectedOption?: SelectOption | null,
): SelectOption[] {
  if (!selectedOption) {
    return options;
  }

  const optionMap = new Map<string, SelectOption>([
    [selectedOption.value, selectedOption],
  ]);

  for (const option of options) {
    optionMap.set(option.value, option);
  }

  return Array.from(optionMap.values());
}

export function SearchableSingleSelect({
  value,
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
  invalid,
  enabled = true,
  orderBy = { field: "creation", order: "desc" },
  limit = 20,
  selectedOption,
}: SearchableSingleSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());

  const orFilters = useMemo<Filter[] | undefined>(() => {
    if (!deferredSearch || !searchFields?.length) {
      return undefined;
    }

    return searchFields.map((field) => [field, "like", `%${deferredSearch}%`]);
  }, [deferredSearch, searchFields]);

  const { data } = useGetList<Record<string, unknown>>(
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
    () => mergeOptions(options, selectedOption),
    [options, selectedOption],
  );

  const currentOption = useMemo(
    () => mergedOptions.find((option) => option.value === value) ?? selectedOption,
    [mergedOptions, selectedOption, value],
  );

  return (
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
            !currentOption && "text-muted-foreground",
            invalid && "border-destructive",
          )}
        >
          <span className="truncate">{currentOption?.label ?? placeholder}</span>
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
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {mergedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{option.label}</p>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 size-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

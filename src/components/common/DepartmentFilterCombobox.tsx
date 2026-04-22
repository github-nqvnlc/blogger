import { BlogDepartment } from "@/types/blogs";
import React from "react";
import { Filter } from "@/types/hooks";
import { useGetList } from "@/hooks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function DepartmentFilterCombobox({
  value,
  onChange,
  onDepartmentsChange,
  isLoading,
  placeholder,
  allLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onDepartmentsChange?: (departments: BlogDepartment[]) => void;
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
      ["department_name", "like", `%${keyword}%`],
      ["department_code", "like", `%${keyword}%`],
    ];
  }, [deferredSearch]);

  const { data: filteredDepartments } = useGetList<BlogDepartment>("blog_departments", {
    fields: ["name", "department_name", "department_code"],
    orFilters: searchFilters,
    orderBy: { field: "department_name", order: "asc" },
    limit: 20,
  });

  React.useEffect(() => {
    if (!deferredSearch && onDepartmentsChange) {
      onDepartmentsChange(filteredDepartments ?? []);
    }
  }, [filteredDepartments, deferredSearch, onDepartmentsChange]);

  const selectedDept =
    value === "all" ? null : (filteredDepartments ?? []).find(d => d.name === value);

  const handleSelect = (deptName: string) => {
    onChange(deptName);
    setOpen(false);
    setSearch("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearch("");
    } else {
      searchInputRef.current?.focus();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[250px] justify-start"
        >
          {isLoading && <Spinner className="mr-2 size-4" />}
          {selectedDept ? (
            <span className="truncate">{selectedDept.department_name}</span>
          ) : value === "all" ? (
            <span className="truncate text-muted-foreground">{allLabel}</span>
          ) : (
            <span className="truncate text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] sm:w-[250px] p-0" align="start">
        <div className="border-b p-2">
          <Input
            ref={searchInputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={placeholder}
          />
        </div>
        <div
          className="max-h-64 overflow-y-auto overscroll-contain p-1"
          onWheel={event => event.stopPropagation()}
        >
          <button
            type="button"
            className={cn(
              "hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm",
              value === "all" && "bg-accent/50"
            )}
            onClick={() => handleSelect("all")}
          >
            <span className="font-medium">{allLabel}</span>
            {value === "all" && <Check className="ml-2 h-4 w-4 shrink-0" />}
          </button>
          {(filteredDepartments ?? []).map(dept => {
            const isSelected = value === dept.name;
            return (
              <button
                key={dept.name}
                type="button"
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm",
                  isSelected && "bg-accent/50"
                )}
                onClick={() => handleSelect(dept.name)}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{dept.department_name}</p>
                </div>
                <Check
                  className={cn("ml-2 h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                />
              </button>
            );
          })}
          {(filteredDepartments ?? []).length === 0 && !deferredSearch && (
            <p className="p-2 text-center text-sm text-muted-foreground">No departments found</p>
          )}
          {deferredSearch && (filteredDepartments ?? []).length === 0 && (
            <p className="p-2 text-center text-sm text-muted-foreground">
              No results for &ldquo;{deferredSearch}&rdquo;
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

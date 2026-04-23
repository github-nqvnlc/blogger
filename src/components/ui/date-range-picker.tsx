"use client";

import {
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DatePickerWithRangeProps = {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
};

type RangePreset = {
  label: string;
  getRange: () => DateRange;
};

const rangePresets: RangePreset[] = [
  {
    label: "Today",
    getRange: () => {
      const today = startOfDay(new Date());
      return { from: today, to: today };
    },
  },
  {
    label: "Yesterday",
    getRange: () => {
      const yesterday = startOfDay(subDays(new Date(), 1));
      return { from: yesterday, to: yesterday };
    },
  },
  {
    label: "This week",
    getRange: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: "This month",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: "3 months",
    getRange: () => ({
      from: startOfDay(subMonths(new Date(), 3)),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: "6 months",
    getRange: () => ({
      from: startOfDay(subMonths(new Date(), 6)),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: "This year",
    getRange: () => ({
      from: startOfYear(new Date()),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: "All year",
    getRange: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
];

export function DatePickerWithRange({ value, onChange }: DatePickerWithRangeProps) {
  return (
    <Field className="w-72">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-picker-range"
            className="justify-start px-2.5 font-normal"
          >
            <CalendarIcon />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} - {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex">
            <div className="border-r p-2">
              <div className="grid gap-1">
                {rangePresets.map(preset => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    onClick={() => onChange(preset.getRange())}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <Calendar
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}

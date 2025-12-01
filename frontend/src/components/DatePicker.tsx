"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from 'date-fns/locale';

import { cn } from "../lib/utils"
import { Calendar } from "./ui/Calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/Popover"

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date | undefined) => void;
}

export function DatePicker({ date, onDateChange }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(selectedDate);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-xl border border-app-border bg-app-bg px-4 py-2 text-left text-base font-medium text-app-text ring-offset-background hover:bg-app-elevated focus:outline-none focus:ring-2 focus:ring-app-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          )}
        >
          <span className="material-symbols-outlined text-app-muted mr-3">calendar_today</span>
          {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }) : <span>Selecciona una fecha</span>}
          <span className={cn("material-symbols-outlined text-app-muted ml-auto transition-transform", open && "rotate-180")}>expand_more</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          disabled={(current) => current > new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}
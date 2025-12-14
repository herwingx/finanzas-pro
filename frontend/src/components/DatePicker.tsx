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
            "flex h-14 w-full items-center justify-between rounded-2xl border border-app-border bg-app-elevated px-3 py-2 text-left text-sm text-app-text shadow-sm transition-all duration-300 overflow-hidden",
            "hover:border-app-primary/50 hover:bg-app-elevated/80",
            "focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="material-symbols-outlined text-app-primary/80 shrink-0 text-xl">calendar_today</span>
            {date ? (
              <span className="font-medium truncate">{format(date, "d MMM yyyy", { locale: es })}</span>
            ) : (
              <span className="text-app-muted font-normal truncate">Selecciona fecha</span>
            )}
          </div>
          <span className={cn("material-symbols-outlined text-app-muted transition-transform duration-300 shrink-0 ml-1", open && "rotate-180 text-app-primary")}>expand_more</span>
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
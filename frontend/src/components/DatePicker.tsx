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
            "flex h-14 w-full items-center justify-between rounded-xl border border-app-border bg-app-bg/50 px-4 py-2 text-left text-base font-bold text-app-text ring-offset-background hover:bg-app-elevated/80 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary focus:bg-app-elevated disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
          )}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-app-muted">calendar_today</span>
            {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }) : <span className="text-app-muted/50 font-normal">Selecciona una fecha</span>}
          </div>
          <span className={cn("material-symbols-outlined text-app-muted transition-transform duration-300", open && "rotate-180 text-app-primary")}>expand_more</span>
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
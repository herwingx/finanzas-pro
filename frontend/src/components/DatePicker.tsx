"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from 'date-fns/locale'

import { cn } from "../lib/utils"
import { Calendar } from "./ui/Calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/Popover"

interface DatePickerProps {
  date?: Date; // Opcional para placeholder
  onDateChange: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabledDays?: (date: Date) => boolean; // Lógica custom para deshabilitar
  disabled?: boolean;
}

export function DatePicker({
  date,
  onDateChange,
  className,
  placeholder = "Seleccionar fecha",
  disabledDays,
  disabled
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    // Si selectedDate es undefined (deselección), permitimos pasarlo o no, 
    // pero generalmente en este picker queremos forzar un valor.
    // Aquí cerramos solo si hay valor.
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
          disabled={disabled}
          className={cn(
            "relative flex w-full items-center justify-between",
            "bg-app-surface border border-app-border text-app-text",
            "rounded-xl px-4 py-3 text-left text-sm transition-all duration-200",
            "hover:bg-app-subtle hover:border-app-border-medium",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/50 focus-visible:border-app-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-app-subtle",
            // Active touch feedback for mobile
            "active:scale-[0.99] active:bg-app-subtle",
            // Estado cuando está vacío vs lleno
            !date && "text-app-muted",
            className
          )}
        >
          <div className="flex items-center gap-3 truncate">
            <span className={`material-symbols-outlined text-[20px] shrink-0 ${date ? 'text-app-primary' : 'text-app-muted'}`}>
              calendar_today
            </span>
            <span className="font-medium truncate block">
              {date ? (
                format(date, "EEE, d 'de' MMM yyyy", { locale: es })
              ) : (
                <span className="opacity-70 font-normal">{placeholder}</span>
              )}
            </span>
          </div>

          <span
            className={cn(
              "material-symbols-outlined text-app-muted/70 text-[20px] transition-transform duration-200 shrink-0 ml-2",
              open && "rotate-180 text-app-primary"
            )}
          >
            expand_more
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          "w-auto p-3 rounded-2xl bg-app-surface border border-app-border",
          "shadow-premium backdrop-blur-3xl",
          "animate-in zoom-in-95 fade-in-0 duration-200",
          // Mobile: full width and centered, Desktop: auto width
          "max-w-[calc(100vw-2rem)] sm:max-w-none"
        )}
        align="start"
        sideOffset={8}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          defaultMonth={date} // ← Opens calendar on the selected date's month
          initialFocus
          disabled={disabledDays}
        />
      </PopoverContent>
    </Popover>
  )
}
"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { es } from 'date-fns/locale'

import { cn } from "../../lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      locale={es}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-sm font-bold text-app-text capitalize",
        nav: "space-x-1 flex items-center",
        // Navegación (Flechas)
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 rounded-lg flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity",
          "hover:bg-app-subtle hover:text-app-text text-app-muted"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",

        // Tabla
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-app-muted rounded-md w-9 font-normal text-[0.8rem] uppercase tracking-wide",
        row: "flex w-full mt-2",

        // Celdas de Día
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent",
          // Fix visual roundness for range selections if added later
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-lg transition-all duration-200",
          "hover:bg-app-subtle hover:text-app-text text-app-text focus:bg-app-subtle focus:outline-none focus:ring-2 focus:ring-app-primary/50",
          "active:scale-95" // Efecto clic nativo
        ),

        // Estados
        day_selected: cn(
          "bg-app-primary text-white shadow-md shadow-app-primary/20 hover:bg-app-primary hover:text-white focus:bg-app-primary focus:text-white font-semibold",
          "hover:opacity-90" // Simple hover effect
        ),
        day_today: "bg-app-subtle/80 text-app-text font-bold border border-app-border", // Hoy: sutil, no primary para no confundir
        day_outside: "text-app-muted/40 opacity-50 hover:bg-transparent cursor-default",
        day_disabled: "text-app-muted/20 opacity-30 cursor-not-allowed hover:bg-transparent hover:text-app-muted/20",
        day_range_middle: "aria-selected:bg-app-subtle aria-selected:text-app-text",
        day_hidden: "invisible",

        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => (
          <span className="material-symbols-outlined text-[18px]">
            {orientation === "left" ? "chevron_left" : "chevron_right"}
          </span>
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
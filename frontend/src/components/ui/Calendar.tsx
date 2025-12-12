"use client"

import * as React from "react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import { es } from 'date-fns/locale';

import { cn } from "../../lib/utils"

export type CalendarProps = DayPickerProps

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      locale={es}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-1",
        caption_label: "text-base font-bold text-app-text",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          "h-9 w-9 bg-transparent p-0 rounded-lg hover:bg-app-elevated text-app-text transition-colors flex items-center justify-center absolute left-1"
        ),
        button_next: cn(
          "h-9 w-9 bg-transparent p-0 rounded-lg hover:bg-app-elevated text-app-text transition-colors flex items-center justify-center absolute right-1"
        ),
        month_grid: "w-full border-collapse mt-4",
        weekdays: "flex justify-between",
        weekday:
          "text-app-muted rounded-md w-10 font-semibold text-xs uppercase tracking-wide",
        week: "flex w-full mt-1 justify-between",
        day_button: cn(
          "h-10 w-10 p-0 font-medium rounded-lg",
          "hover:bg-app-elevated hover:text-app-text",
          "focus:outline-none focus:ring-2 focus:ring-app-primary focus:ring-offset-1",
          "transition-all duration-150",
          "flex items-center justify-center"
        ),
        selected:
          "bg-app-primary text-white font-bold hover:bg-app-primary hover:text-white focus:bg-app-primary focus:text-white shadow-glow-sm shadow-app-primary/50 scale-105",
        today: cn(
          "bg-app-elevated text-app-text font-bold",
          "ring-2 ring-app-primary/30"
        ),
        outside: "text-app-muted/40 opacity-50 hover:opacity-75",
        disabled: "text-app-muted/30 opacity-30 hover:bg-transparent cursor-not-allowed",
        range_middle:
          "aria-selected:bg-app-elevated aria-selected:text-app-text",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => (
          <span className="material-symbols-outlined text-lg">
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
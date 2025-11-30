"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { es } from 'date-fns/locale';

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
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-app-muted rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-app-elevated first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-app-elevated"
        ),
        day_selected:
          "bg-app-primary text-white hover:bg-app-primary/90 focus:bg-app-primary focus:text-white",
        day_today: "bg-app-elevated text-app-text",
        day_outside: "text-app-muted opacity-50",
        day_disabled: "text-app-muted opacity-50",
        day_range_middle:
          "aria-selected:bg-app-elevated aria-selected:text-app-text",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <span className="material-symbols-outlined text-base">chevron_left</span>,
        IconRight: ({ ...props }) => <span className="material-symbols-outlined text-base">chevron_right</span>,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
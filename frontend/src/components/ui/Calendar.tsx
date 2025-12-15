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
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center relative items-center h-7",
        caption_label: "text-sm font-bold text-app-text capitalize",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 h-7 w-7 bg-transparent p-0 rounded-lg flex items-center justify-center",
          "opacity-50 hover:opacity-100 transition-opacity cursor-pointer",
          "hover:bg-app-subtle text-app-muted hover:text-app-text"
        ),
        button_next: cn(
          "absolute right-1 h-7 w-7 bg-transparent p-0 rounded-lg flex items-center justify-center",
          "opacity-50 hover:opacity-100 transition-opacity cursor-pointer",
          "hover:bg-app-subtle text-app-muted hover:text-app-text"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-app-muted w-9 font-normal text-[0.8rem] capitalize text-center",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button: cn(
          "h-9 w-9 p-0 font-normal rounded-lg transition-all duration-200",
          "flex items-center justify-center",
          "hover:bg-app-subtle hover:text-app-text text-app-text",
          "focus:bg-app-subtle focus:outline-none focus:ring-2 focus:ring-app-primary/50",
          "active:scale-95 cursor-pointer"
        ),
        selected: "bg-app-primary text-white shadow-md shadow-app-primary/20 hover:bg-app-primary hover:text-white focus:bg-app-primary focus:text-white font-semibold",
        today: "bg-app-subtle border border-app-border text-app-text font-bold",
        outside: "text-app-muted/40 opacity-50",
        disabled: "text-app-muted/20 opacity-30 cursor-not-allowed hover:bg-transparent",
        hidden: "invisible",
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
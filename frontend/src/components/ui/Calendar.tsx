"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { es } from 'date-fns/locale'
import { format, setMonth, setYear } from 'date-fns'

import { cn } from "../../lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // Get initial month from props - handle different calendar modes
  const getInitialMonth = (): Date => {
    if (props.defaultMonth) return props.defaultMonth;
    // Check if we're in single mode and have a selected date
    if ('selected' in props && props.selected instanceof Date) {
      return props.selected;
    }
    return new Date();
  };

  // Track current displayed month for custom navigation
  const [displayMonth, setDisplayMonth] = React.useState<Date>(getInitialMonth);

  // Update display month when selected date changes externally
  React.useEffect(() => {
    if ('selected' in props && props.selected instanceof Date) {
      setDisplayMonth(props.selected);
    }
  }, ['selected' in props ? props.selected : null]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    setDisplayMonth(prev => setMonth(prev, newMonth));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setDisplayMonth(prev => setYear(prev, newYear));
  };

  return (
    <div className="flex flex-col">
      {/* Month/Year Selector */}
      <div className="flex items-center justify-center gap-2 mb-3 px-3">
        <select
          value={displayMonth.getMonth()}
          onChange={handleMonthChange}
          className={cn(
            "bg-app-subtle border border-app-border rounded-lg px-2 py-1.5",
            "text-sm font-medium text-app-text capitalize cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-app-primary/50",
            "hover:bg-app-surface transition-colors"
          )}
        >
          {months.map(month => (
            <option key={month} value={month}>
              {format(new Date(2024, month, 1), 'MMMM', { locale: es })}
            </option>
          ))}
        </select>

        <select
          value={displayMonth.getFullYear()}
          onChange={handleYearChange}
          className={cn(
            "bg-app-subtle border border-app-border rounded-lg px-2 py-1.5",
            "text-sm font-medium text-app-text cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-app-primary/50",
            "hover:bg-app-surface transition-colors"
          )}
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <DayPicker
        showOutsideDays={showOutsideDays}
        month={displayMonth}
        onMonthChange={setDisplayMonth}
        className={cn("p-3 pt-0", className)}
        locale={es}
        fixedWeeks // ← Keeps calendar height consistent (always 6 rows)
        classNames={{
          months: "flex flex-col sm:flex-row gap-4",
          month: "flex flex-col gap-2",
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
          today: cn(
            "relative font-bold text-app-primary",
            "after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2",
            "after:w-1 after:h-1 after:rounded-full after:bg-app-primary"
          ),
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
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
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

  // Custom select wrapper styles
  const selectWrapperClass = cn(
    "relative inline-flex items-center"
  );

  const selectClass = cn(
    // Base styles
    "appearance-none bg-app-surface border border-app-border rounded-xl",
    "text-sm font-semibold text-app-text cursor-pointer",
    // Padding - more space on right for custom arrow
    "pl-3 pr-8 py-2",
    // Focus & Hover
    "focus:outline-none focus:ring-2 focus:ring-app-primary/40 focus:border-app-primary",
    "hover:bg-app-subtle hover:border-app-border transition-all duration-200",
    // Active state
    "active:scale-[0.98]"
  );

  return (
    <div className="flex flex-col">
      {/* Month/Year Selector - Premium Design */}
      <div className="flex items-center justify-center gap-2 mb-4 px-2">
        {/* Month Dropdown */}
        <div className={selectWrapperClass}>
          <select
            value={displayMonth.getMonth()}
            onChange={handleMonthChange}
            className={cn(selectClass, "capitalize min-w-[110px]")}
          >
            {months.map(month => (
              <option key={month} value={month}>
                {format(new Date(2024, month, 1), 'MMMM', { locale: es })}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 text-[16px] text-app-muted pointer-events-none">
            expand_more
          </span>
        </div>

        {/* Year Dropdown */}
        <div className={selectWrapperClass}>
          <select
            value={displayMonth.getFullYear()}
            onChange={handleYearChange}
            className={cn(selectClass, "min-w-[80px]")}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 text-[16px] text-app-muted pointer-events-none">
            expand_more
          </span>
        </div>
      </div>

      <DayPicker
        showOutsideDays={showOutsideDays}
        month={displayMonth}
        onMonthChange={setDisplayMonth}
        className={cn("pt-0", className)}
        locale={es}
        fixedWeeks // ← Keeps calendar height consistent (always 6 rows)
        hideNavigation // Hide default nav since we have dropdowns
        classNames={{
          months: "flex flex-col sm:flex-row",
          month: "flex flex-col",
          month_caption: "hidden", // Hide the default caption
          caption_label: "hidden",
          nav: "hidden", // Hide default navigation
          button_previous: "hidden",
          button_next: "hidden",
          month_grid: "w-full border-collapse",
          weekdays: "flex justify-center",
          weekday: "text-app-muted w-9 font-normal text-[0.8rem] capitalize text-center",
          week: "flex w-full mt-1 justify-center",
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
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
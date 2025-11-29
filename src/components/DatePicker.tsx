import React, { forwardRef } from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './DatePicker.css';

registerLocale('es', es);

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
  ({ value, onClick }, ref) => (
    <button
      type="button"
      className="flex items-center gap-3 bg-app-bg p-3 rounded-xl border border-app-border w-full text-left"
      onClick={onClick}
      ref={ref}
    >
      <span className="material-symbols-outlined text-app-muted">calendar_today</span>
      <span className="flex-1 text-app-text">{value}</span>
      <span className="material-symbols-outlined text-app-muted">expand_more</span>
    </button>
  )
);

export const DatePicker = ({ date, onDateChange }: DatePickerProps) => {
  return (
    <ReactDatePicker
      selected={date}
      onChange={onDateChange}
      dateFormat="d 'de' MMMM, yyyy"
      locale="es"
      customInput={<CustomInput />}
      maxDate={new Date()} // Prevent selecting future dates
    />
  );
};
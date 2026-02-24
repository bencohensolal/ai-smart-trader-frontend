import DatePicker from 'react-datepicker';
import { formatIsoDate, parseIsoDate } from '../dateUtils';

type DatePickerInputProps = {
  value: string;
  onChange: (next: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

export function DatePickerInput({
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  className,
  placeholder,
}: DatePickerInputProps): JSX.Element {
  return (
    <DatePicker
      selected={parseIsoDate(value)}
      onChange={(nextDate) => {
        onChange(nextDate ? formatIsoDate(nextDate) : '');
      }}
      dateFormat="yyyy-MM-dd"
      minDate={min ? parseIsoDate(min) : undefined}
      maxDate={max ? parseIsoDate(max) : undefined}
      showPopperArrow={false}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      placeholderText={placeholder}
      className={className ?? 'date-picker-input'}
      disabled={disabled}
      required={required}
      isClearable={!required}
      autoComplete="off"
    />
  );
}

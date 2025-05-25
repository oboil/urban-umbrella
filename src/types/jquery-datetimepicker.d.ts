interface DateTimePickerOptions {
  format?: string;
  timepicker?: boolean;
  datepicker?: boolean;
  closeOnDateSelect?: boolean;
  minDate?: Date | string;
  minTime?: string;
  maxTime?: string;
  step?: number;
  onChangeDateTime?: (dp: unknown, $input: JQuery) => void;
}

declare module 'jquery-datetimepicker' {
  interface JQuery {
    datetimepicker(options?: DateTimePickerOptions): JQuery;
    datetimepicker(method: 'destroy'): JQuery;
    datetimepicker(method: string, ...args: unknown[]): JQuery;
  }
}

declare module 'jquery-datetimepicker/build/jquery.datetimepicker.min.css';
declare module 'jquery-datetimepicker/build/jquery.datetimepicker.full.min.js'; 
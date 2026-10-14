import { useState, type InputHTMLAttributes } from 'react';
import { normalizeNumberText } from '../utils/numberInput';

/** Keeps the editable text separate from the numeric value used by the domain. */
export default function NumberInput({ value, defaultValue, onChange, onFocus, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [edit, setEdit] = useState({ source: value, text: String(value ?? defaultValue ?? '') });
  if (edit.source !== value) setEdit({ source: value, text: String(value ?? '') });
  return <input {...props} type="number" inputMode={props.inputMode || (String(props.step || '1').includes('.') || props.step === 'any' ? 'decimal' : 'numeric')}
    value={edit.text}
    onFocus={event => { if (event.currentTarget.value === '0') event.currentTarget.select(); onFocus?.(event); }}
    onChange={event => {
      const text = normalizeNumberText(event.currentTarget.value);
      event.currentTarget.value = text;
      setEdit({ source: typeof value === 'number' ? Number(text) : text, text });
      onChange?.(event);
    }} />;
}

import React, { forwardRef, useEffect, useRef } from 'react';
import IMask from 'imask';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  mask?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    fullWidth = false, 
    leftIcon, 
    rightIcon,
    mask,
    className = '', 
    onChange,
    value,
    ...props 
  }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const maskRef = useRef<IMask.InputMask<any>>();

    useEffect(() => {
      if (mask && inputRef.current) {
        maskRef.current = IMask(inputRef.current, {
          mask,
          lazy: false
        });

        // Handle value changes from mask
        maskRef.current.on('accept', () => {
          if (onChange && inputRef.current) {
            const event = new Event('input', { bubbles: true });
            Object.defineProperty(event, 'target', {
              writable: false,
              value: inputRef.current
            });
            onChange(event as React.ChangeEvent<HTMLInputElement>);
          }
        });

        return () => {
          maskRef.current?.destroy();
        };
      }
    }, [mask, onChange]);

    // Update mask value when prop value changes
    useEffect(() => {
      if (maskRef.current && value !== undefined) {
        maskRef.current.value = String(value);
      }
    }, [value]);

    const inputClasses = `
      block px-3 py-2 border ${
        error 
          ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600 dark:text-red-400 dark:placeholder-red-400' 
          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400'
      } rounded-md shadow-sm 
      ${leftIcon ? 'pl-10' : ''} 
      ${rightIcon ? 'pr-10' : ''} 
      ${fullWidth ? 'w-full' : ''}
      placeholder-gray-400 dark:placeholder-gray-500
      bg-white dark:bg-gray-700
      text-gray-900 dark:text-white
      focus:outline-none focus:ring-1
    `;
    
    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={(node) => {
              // Handle both refs
              inputRef.current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            className={inputClasses}
            value={value}
            onChange={!mask ? onChange : undefined} // Let mask handle onChange when mask is present
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
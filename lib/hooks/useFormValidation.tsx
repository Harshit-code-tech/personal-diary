import { useState, useEffect } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

interface ValidationRules {
  [key: string]: ValidationRule[];
}

interface ValidationErrors {
  [key: string]: string;
}

/**
 * Enhanced form validation hook with inline error messages
 * Provides real-time validation feedback for better UX
 */
export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateField = (name: string, value: string): string => {
    const fieldRules = rules[name];
    if (!fieldRules) return '';

    for (const rule of fieldRules) {
      if (rule.required && !value.trim()) {
        return rule.message;
      }

      if (rule.minLength && value.length < rule.minLength) {
        return rule.message;
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message;
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message;
      }

      if (rule.custom && !rule.custom(value)) {
        return rule.message;
      }
    }

    return '';
  };

  const handleBlur = (name: string, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (name: string, value: string) => {
    // Only validate if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const validateAll = (values: { [key: string]: string }): boolean => {
    setIsValidating(true);
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach((name) => {
      const error = validateField(name, values[name] || '');
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(rules).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );
    setIsValidating(false);

    return isValid;
  };

  const clearErrors = () => {
    setErrors({});
    setTouched({});
  };

  return {
    errors,
    touched,
    isValidating,
    handleBlur,
    handleChange,
    validateAll,
    clearErrors,
  };
}

/**
 * Common validation rules for reuse across forms
 */
export const commonRules = {
  email: [
    {
      required: true,
      message: 'Email is required',
    },
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
  ],
  password: [
    {
      required: true,
      message: 'Password is required',
    },
    {
      minLength: 8,
      message: 'Password must be at least 8 characters',
    },
  ],
  passwordWithStrength: [
    {
      required: true,
      message: 'Password is required',
    },
    {
      minLength: 8,
      message: 'Password must be at least 8 characters',
    },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must include uppercase, lowercase, and number',
    },
  ],
  title: [
    {
      required: true,
      message: 'Title is required',
    },
    {
      minLength: 3,
      message: 'Title must be at least 3 characters',
    },
    {
      maxLength: 200,
      message: 'Title must be less than 200 characters',
    },
  ],
  content: [
    {
      required: true,
      message: 'Content is required',
    },
    {
      minLength: 10,
      message: 'Content must be at least 10 characters',
    },
  ],
  name: [
    {
      required: true,
      message: 'Name is required',
    },
    {
      minLength: 2,
      message: 'Name must be at least 2 characters',
    },
  ],
};

/**
 * Password strength calculator
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  if (score <= 2) {
    return { score, label: 'Weak', color: 'bg-red-500' };
  } else if (score <= 4) {
    return { score, label: 'Fair', color: 'bg-amber-500' };
  } else if (score <= 5) {
    return { score, label: 'Good', color: 'bg-blue-500' };
  } else {
    return { score, label: 'Strong', color: 'bg-green-500' };
  }
}

/**
 * Form field wrapper component with inline validation
 */
interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  multiline?: boolean;
  rows?: number;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  error,
  touched,
  required,
  placeholder,
  maxLength,
  showCharacterCount,
  onChange,
  onBlur,
  multiline,
  rows = 4,
}: FormFieldProps) {
  const hasError = touched && error;
  const isValid = touched && !error && value.length > 0;

  const inputClasses = `
    w-full px-4 py-3 rounded-xl border-2 transition-all
    ${hasError 
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900' 
      : isValid
      ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900'
      : 'border-charcoal/20 dark:border-white/20 focus:border-gold dark:focus:border-teal focus:ring-2 focus:ring-gold/20 dark:focus:ring-teal/20'
    }
    bg-white dark:bg-graphite text-charcoal dark:text-white
    placeholder:text-charcoal/50 dark:placeholder:text-white/50
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none
  `;

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-charcoal dark:text-white">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {multiline ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          rows={rows}
          className={inputClasses}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={inputClasses}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
        />
      )}

      {/* Character count */}
      {showCharacterCount && maxLength && (
        <div className="flex justify-end">
          <span className={`text-xs ${
            value.length > maxLength * 0.9 
              ? 'text-amber-600 dark:text-amber-400' 
              : 'text-charcoal/50 dark:text-white/50'
          }`}>
            {value.length} / {maxLength}
          </span>
        </div>
      )}

      {/* Error message */}
      {hasError && (
        <div 
          id={`${name}-error`}
          className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-slideDown"
          role="alert"
        >
          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
          {error}
        </div>
      )}

      {/* Success indicator */}
      {isValid && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 animate-slideDown">
          <span className="inline-block w-1 h-1 rounded-full bg-green-500" />
          Looks good!
        </div>
      )}
    </div>
  );
}

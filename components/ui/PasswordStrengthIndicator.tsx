'use client'

import { calculatePasswordStrength } from '@/lib/hooks/useFormValidation'

interface PasswordStrengthIndicatorProps {
  password: string;
  showLabel?: boolean;
}

export default function PasswordStrengthIndicator({ 
  password, 
  showLabel = true 
}: PasswordStrengthIndicatorProps) {
  const { score, label, color } = calculatePasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex gap-1">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              index < score 
                ? color 
                : 'bg-charcoal/10 dark:bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Label and tips */}
      {showLabel && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-charcoal dark:text-white">
            Password strength: <span className={`${
              score <= 2 ? 'text-red-600 dark:text-red-400' :
              score <= 4 ? 'text-amber-600 dark:text-amber-400' :
              score <= 5 ? 'text-blue-600 dark:text-blue-400' :
              'text-green-600 dark:text-green-400'
            }`}>{label}</span>
          </p>

          {/* Tips for improvement */}
          {score < 6 && (
            <ul className="text-xs text-charcoal/70 dark:text-white/70 space-y-1 pl-4">
              {password.length < 8 && (
                <li className="list-disc">Use at least 8 characters</li>
              )}
              {password.length < 12 && score >= 1 && (
                <li className="list-disc">Consider using 12+ characters</li>
              )}
              {!/[a-z]/.test(password) && (
                <li className="list-disc">Include lowercase letters</li>
              )}
              {!/[A-Z]/.test(password) && (
                <li className="list-disc">Include uppercase letters</li>
              )}
              {!/\d/.test(password) && (
                <li className="list-disc">Include numbers</li>
              )}
              {!/[^a-zA-Z\d]/.test(password) && (
                <li className="list-disc">Include special characters (!@#$%^&*)</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  showLockIcon?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showLockIcon = true, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        {showLockIcon && (
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(showLockIcon ? "pl-10" : "", "pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  suggestions: string[];
  color: string;
}

export function evaluatePassword(pw: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;
  if (pw.length >= 8) score++;
  else suggestions.push("Use at least 8 characters");
  if (pw.length >= 12) score++;
  else if (pw.length >= 8) suggestions.push("Use 12+ characters for stronger security");
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  else suggestions.push("Mix uppercase and lowercase letters");
  if (/\d/.test(pw)) score++;
  else suggestions.push("Add at least one number");
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  else suggestions.push("Add a special character (e.g. !@#$%)");

  const normalized = Math.min(4, Math.max(0, score - 1));
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const colors = ["bg-destructive", "bg-destructive", "bg-yellow-500", "bg-green-500", "bg-green-600"];
  return {
    score: normalized,
    label: labels[normalized],
    suggestions,
    color: colors[normalized],
  };
}

export const PasswordStrengthMeter = ({ password }: { password: string }) => {
  if (!password) return null;
  const { score, label, suggestions, color } = evaluatePassword(password);
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= score ? color : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength: <span className="font-medium text-foreground">{label}</span>
      </p>
      {suggestions.length > 0 && (
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {suggestions.slice(0, 3).map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

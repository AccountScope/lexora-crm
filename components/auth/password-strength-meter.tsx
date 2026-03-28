"use client";

import { useMemo } from "react";
import zxcvbn from "zxcvbn";
import { cn } from "@/lib/utils/cn";

const labels = ["Very weak", "Weak", "Medium", "Strong", "Very strong"];
const colors = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#16a34a"];

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

const unmetHints = (password: string) => {
  const hints: string[] = [];
  if (!/[A-Z]/.test(password)) hints.push("Add an uppercase letter");
  if (!/[a-z]/.test(password)) hints.push("Add a lowercase letter");
  if (!/[0-9]/.test(password)) hints.push("Add a number");
  if (!/[!@#$%^&*]/.test(password)) hints.push("Add a special character (!@#$%^&*)");
  if (password.length < 12) hints.push("Use at least 12 characters");
  return hints;
};

export const PasswordStrengthMeter = ({ password, className }: PasswordStrengthMeterProps) => {
  const metrics = useMemo(() => {
    if (!password) {
      return { score: 0, suggestions: ["Start typing a secure password."], warning: "" };
    }
    const result = zxcvbn(password);
    const suggestions = new Set<string>(unmetHints(password));
    if (result.feedback?.warning) suggestions.add(result.feedback.warning);
    (result.feedback?.suggestions ?? []).forEach((tip) => suggestions.add(tip));
    return { score: result.score, suggestions: Array.from(suggestions).filter(Boolean) };
  }, [password]);

  const level = Math.min(Math.max(metrics.score, 0), 4);
  const percentage = ((level + 1) / labels.length) * 100;

  return (
    <div className={cn("space-y-2 text-xs", className)}>
      <div className="flex items-center justify-between">
        <span className="font-medium">Strength</span>
        <span className="text-muted-foreground">{labels[level]}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: colors[level] }}
        />
      </div>
      <ul className="space-y-1 text-muted-foreground">
        {metrics.suggestions.slice(0, 3).map((suggestion) => (
          <li key={suggestion}>• {suggestion}</li>
        ))}
      </ul>
    </div>
  );
};

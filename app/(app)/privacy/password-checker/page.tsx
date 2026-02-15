"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  X,
  Shield,
  AlertTriangle,
  Copy,
  RefreshCw,
  Zap,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

interface PasswordAnalysis {
  score: number;
  level: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  color: string;
  bgColor: string;
  crackTime: string;
  checks: {
    label: string;
    passed: boolean;
  }[];
  suggestions: string[];
}

function analyzePassword(password: string): PasswordAnalysis {
  const checks = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "At least 12 characters", passed: password.length >= 12 },
    { label: "Contains uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Contains number", passed: /[0-9]/.test(password) },
    { label: "Contains special character", passed: /[^A-Za-z0-9]/.test(password) },
    { label: "No common patterns", passed: !/^(123|abc|qwerty|password|admin|letmein)/i.test(password) && !/(.)\1{2,}/.test(password) },
    { label: "Not a common password", passed: !["password", "123456", "12345678", "qwerty", "abc123", "password1", "admin", "letmein", "welcome", "monkey", "1234567890", "trustno1", "iloveyou"].includes(password.toLowerCase()) },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  let score = 0;

  // Base score from length
  score += Math.min(password.length * 4, 40);
  // Bonus for variety
  if (/[A-Z]/.test(password)) score += 10;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  // Penalty for common patterns
  if (/^(123|abc|qwerty|password)/i.test(password)) score -= 30;
  if (/(.)\1{2,}/.test(password)) score -= 20;

  score = Math.max(0, Math.min(100, score));

  let level: PasswordAnalysis["level"];
  let color: string;
  let bgColor: string;

  if (score < 20) {
    level = "Very Weak";
    color = "text-red-600";
    bgColor = "bg-red-500";
  } else if (score < 40) {
    level = "Weak";
    color = "text-orange-500";
    bgColor = "bg-orange-500";
  } else if (score < 60) {
    level = "Fair";
    color = "text-amber-500";
    bgColor = "bg-amber-500";
  } else if (score < 80) {
    level = "Strong";
    color = "text-green-500";
    bgColor = "bg-green-500";
  } else {
    level = "Very Strong";
    color = "text-emerald-600";
    bgColor = "bg-emerald-500";
  }

  // Estimate crack time
  const charsetSize =
    (/[a-z]/.test(password) ? 26 : 0) +
    (/[A-Z]/.test(password) ? 26 : 0) +
    (/[0-9]/.test(password) ? 10 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 32 : 0);

  const combinations = Math.pow(charsetSize || 1, password.length);
  const guessesPerSecond = 1e10; // 10 billion guesses/sec
  const seconds = combinations / guessesPerSecond / 2;

  let crackTime: string;
  if (seconds < 1) crackTime = "Instantly";
  else if (seconds < 60) crackTime = `${Math.round(seconds)} seconds`;
  else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)} minutes`;
  else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)} hours`;
  else if (seconds < 86400 * 365) crackTime = `${Math.round(seconds / 86400)} days`;
  else if (seconds < 86400 * 365 * 1000) crackTime = `${Math.round(seconds / (86400 * 365))} years`;
  else if (seconds < 86400 * 365 * 1e6) crackTime = `${Math.round(seconds / (86400 * 365 * 1000))}K+ years`;
  else crackTime = "Centuries";

  const suggestions: string[] = [];
  if (password.length < 12) suggestions.push("Use at least 12 characters for better security");
  if (!/[A-Z]/.test(password)) suggestions.push("Add uppercase letters (A-Z)");
  if (!/[0-9]/.test(password)) suggestions.push("Add numbers (0-9)");
  if (!/[^A-Za-z0-9]/.test(password)) suggestions.push("Add special characters (!@#$%^&*)");
  if (/(.)\1{2,}/.test(password)) suggestions.push("Avoid repeating characters");
  if (suggestions.length === 0 && score < 100) suggestions.push("Consider using a passphrase like 'correct-horse-battery-staple'");

  return { score, level, color, bgColor, crackTime, checks, suggestions };
}

function generateStrongPassword(length: number = 16): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*_-+=";
  const all = upper + lower + digits + special;

  let password = "";
  // Ensure at least one of each type
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export default function PasswordCheckerPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const analysis = useMemo(() => {
    if (!password) return null;
    return analyzePassword(password);
  }, [password]);

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    setPassword(newPassword);
    setShowPassword(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/privacy">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Privacy
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Password Strength Checker"
        description="Test how strong your passwords are — everything stays on your device"
        icon={KeyRound}
        iconColor="text-indigo-500"
        iconBgColor="bg-indigo-500/10"
      />

      <Alert variant="info" className="mb-6">
        <Shield className="w-4 h-4" />
        <div>
          <strong>100% Private:</strong> Your password is never sent to any server. All analysis happens locally in your browser.
        </div>
      </Alert>

      {/* Password Input */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Enter a Password to Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Type or paste a password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<KeyRound className="w-4 h-4" />}
                className="pr-20 text-lg font-mono"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {password && (
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    aria-label="Copy password"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePassword}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Strong Password
            </Button>
            {copied && (
              <Badge variant="success" className="gap-1">
                <Check className="w-3 h-3" />
                Copied!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="mt-6 space-y-6">
          {/* Score Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`text-4xl font-bold ${analysis.color}`}>
                      {analysis.score}
                    </span>
                    <span className="text-muted-foreground text-lg">/ 100</span>
                  </div>
                  <Badge
                    className={`mt-2 ${analysis.bgColor} text-white border-0`}
                  >
                    {analysis.level}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated crack time</p>
                    <p className="font-semibold text-lg">{analysis.crackTime}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${analysis.bgColor} rounded-full transition-all duration-500`}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Checks Grid */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Security Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.checks.map((check, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      check.passed
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    {check.passed ? (
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-sm">{check.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Info Section when no password entered */}
      {!password && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Password Security Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                Use at least 12 characters — longer is always better
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                Mix uppercase, lowercase, numbers, and special characters
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                Avoid personal information like birthdays or pet names
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                Use a unique password for every account
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                Consider using a passphrase: &quot;correct-horse-battery-staple&quot;
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

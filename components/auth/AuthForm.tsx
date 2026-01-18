"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, AlertCircle, Send, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmailInput } from "./EmailInput";
import { AuthModeToggle } from "./AuthModeToggle";
import {
  validateEmail,
  getAuthErrorMessage,
  type AuthMode,
  type AuthErrorType,
} from "@/src/lib/validations/auth";
import { signUp, signIn, verifyOtpCode } from "@/src/lib/actions/auth";

// ============================================================================
// Types
// ============================================================================

interface AuthFormProps {
  /** Initial authentication mode */
  initialMode?: AuthMode;
  /** Initial email value (e.g., from query params) */
  initialEmail?: string;
  /** URL to redirect after successful authentication */
  redirectTo?: string;
  /** Error type from query params (e.g., expired token) */
  error?: AuthErrorType;
  /** Additional CSS classes */
  className?: string;
}

type FormStatus = "idle" | "loading" | "success" | "error" | "verifying";

interface FormState {
  email: string;
  mode: AuthMode;
  status: FormStatus;
  error: string | null;
  otpCode: string;
  otpError: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const FORM_TITLES: Record<AuthMode, string> = {
  signin: "Zaloguj się",
  signup: "Zarejestruj się",
};

const SUBMIT_BUTTON_LABELS: Record<AuthMode, string> = {
  signin: "Wyślij link do logowania",
  signup: "Wyślij link rejestracyjny",
};

const SUCCESS_MESSAGES = {
  title: "Sprawdź swoją skrzynkę e-mail",
  description: "Wysłaliśmy link i kod weryfikacyjny na podany adres e-mail.",
  instruction: "Kliknij link w e-mailu lub wpisz 6-cyfrowy kod poniżej:",
  note: "Kod jest ważny przez 1 godzinę.",
};

// ============================================================================
// Component
// ============================================================================

export function AuthForm({
  initialMode = "signup",
  initialEmail = "",
  redirectTo,
  error: initialError,
  className,
}: AuthFormProps) {
  const router = useRouter();
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formState, setFormState] = useState<FormState>({
    email: initialEmail,
    mode: initialMode,
    status: "idle",
    error: null,
    otpCode: "",
    otpError: null,
  });

  // Validation state
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  // Show error from query params on mount
  useEffect(() => {
    if (initialError) {
      const errorMessage = getAuthErrorMessage(initialError);
      setFormState((prev) => ({
        ...prev,
        status: "error",
        error: errorMessage,
      }));
    }
  }, [initialError]);

  // Focus OTP input when entering success state
  useEffect(() => {
    if (formState.status === "success" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [formState.status]);

  // Handlers
  const handleEmailChange = useCallback((value: string) => {
    setFormState((prev) => ({
      ...prev,
      email: value,
      status: prev.status === "success" ? "idle" : prev.status,
      error: prev.status === "error" ? null : prev.error,
    }));

    // Clear validation error when user starts typing
    if (emailError) {
      setEmailError(undefined);
    }
  }, [emailError]);

  const handleModeChange = useCallback((mode: AuthMode) => {
    setFormState((prev) => ({
      ...prev,
      mode,
      status: "idle",
      error: null,
    }));
    setEmailError(undefined);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Clear previous errors
      setEmailError(undefined);
      setFormState((prev) => ({ ...prev, error: null }));

      // Validate email
      const validation = validateEmail(formState.email);

      if (!validation.isValid) {
        setEmailError(validation.error);
        return;
      }

      // Set loading state
      setFormState((prev) => ({ ...prev, status: "loading" }));

      try {
        // Call the appropriate Server Action based on mode
        const result = formState.mode === "signup"
          ? await signUp(formState.email, redirectTo)
          : await signIn(formState.email, redirectTo);

        if (!result.success) {
          // Handle automatic mode switching (US-005)
          // If account doesn't exist during login -> switch to signup
          if (result.errorCode === "account_not_found") {
            setFormState((prev) => ({
              ...prev,
              mode: "signup",
              status: "error",
              error: result.error || "Konto nie istnieje",
            }));
            toast.error("Konto nie istnieje", {
              description: "Przełączono na tryb rejestracji.",
            });
            return;
          }

          // If account exists during signup -> switch to signin
          if (result.errorCode === "account_exists") {
            setFormState((prev) => ({
              ...prev,
              mode: "signin",
              status: "error",
              error: result.error || "Konto już istnieje",
            }));
            toast.error("Konto już istnieje", {
              description: "Przełączono na tryb logowania.",
            });
            return;
          }

          // Handle rate limiting
          if (result.errorCode === "rate_limit") {
            setFormState((prev) => ({
              ...prev,
              status: "error",
              error: result.error || "Zbyt wiele prób",
            }));
            toast.error("Zbyt wiele prób", {
              description: "Spróbuj ponownie za kilka minut.",
            });
            return;
          }

          // Handle other errors
          throw new Error(result.error || "Wystąpił błąd");
        }

        // Success state
        setFormState((prev) => ({
          ...prev,
          status: "success",
          error: null,
        }));

        toast.success("Link wysłany!", {
          description: result.message || "Sprawdź swoją skrzynkę e-mail.",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";

        setFormState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
        }));

        toast.error("Błąd", {
          description: errorMessage,
        });
      }
    },
    [formState.email, formState.mode, redirectTo]
  );

  const handleRetry = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      status: "idle",
      error: null,
      otpCode: "",
      otpError: null,
    }));
  }, []);

  const handleOtpChange = useCallback((value: string) => {
    // Only allow digits and max 6 characters
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    setFormState((prev) => ({
      ...prev,
      otpCode: sanitized,
      otpError: null,
    }));
  }, []);

  const handleOtpSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate OTP code
      if (formState.otpCode.length !== 6) {
        setFormState((prev) => ({
          ...prev,
          otpError: "Kod musi składać się z 6 cyfr",
        }));
        return;
      }

      // Set verifying state
      setFormState((prev) => ({ ...prev, status: "verifying", otpError: null }));

      try {
        const result = await verifyOtpCode(formState.email, formState.otpCode);

        if (!result.success) {
          setFormState((prev) => ({
            ...prev,
            status: "success", // Stay in success state to allow retry
            otpError: result.error || "Nieprawidłowy kod",
          }));
          toast.error("Błąd weryfikacji", {
            description: result.error || "Nieprawidłowy kod",
          });
          return;
        }

        // Success - redirect
        toast.success("Zalogowano pomyślnie!", {
          description: "Przekierowujemy do aplikacji...",
        });

        // Redirect to target page
        router.push(result.redirectTo || redirectTo || "/galeria");
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";

        setFormState((prev) => ({
          ...prev,
          status: "success",
          otpError: errorMessage,
        }));

        toast.error("Błąd", {
          description: errorMessage,
        });
      }
    },
    [formState.email, formState.otpCode, redirectTo, router]
  );

  // Derived state
  const isLoading = formState.status === "loading";
  const isSuccess = formState.status === "success";
  const isVerifying = formState.status === "verifying";
  const isDisabled = isLoading || isSuccess || isVerifying;

  // Render success state with OTP input
  if (isSuccess || isVerifying) {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle2
                className="size-8 text-green-600 dark:text-green-400"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{SUCCESS_MESSAGES.title}</h2>
              <p className="text-sm text-muted-foreground">
                {SUCCESS_MESSAGES.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {SUCCESS_MESSAGES.instruction}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <span>Wysłano na: </span>
              <span className="font-medium text-foreground">
                {formState.email}
              </span>
            </div>

            {/* OTP Code Input */}
            <form onSubmit={handleOtpSubmit} className="w-full max-w-xs space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-code" className="sr-only">
                  Kod weryfikacyjny
                </Label>
                <Input
                  ref={otpInputRef}
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={formState.otpCode}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  disabled={isVerifying}
                  className={cn(
                    "text-center text-2xl font-mono tracking-[0.5em] h-14",
                    formState.otpError && "border-destructive focus-visible:ring-destructive"
                  )}
                  aria-describedby={formState.otpError ? "otp-error" : undefined}
                  aria-invalid={!!formState.otpError}
                />
                {formState.otpError && (
                  <p
                    id="otp-error"
                    className="flex items-center gap-1.5 text-sm text-destructive"
                    role="alert"
                  >
                    <AlertCircle className="size-4" aria-hidden="true" />
                    {formState.otpError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {SUCCESS_MESSAGES.note}
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isVerifying || formState.otpCode.length !== 6}
                className="w-full gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Weryfikowanie...
                  </>
                ) : (
                  <>
                    <KeyRound className="size-4" aria-hidden="true" />
                    Zweryfikuj kod
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-muted-foreground">Nie otrzymałeś kodu?</span>
              <Button
                variant="link"
                size="sm"
                onClick={handleRetry}
                disabled={isVerifying}
                className="h-auto p-0"
              >
                Wyślij ponownie
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render form
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-center text-2xl">
          {FORM_TITLES[formState.mode]}
        </CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          {formState.mode === "signup"
            ? "Podaj swój adres e-mail, aby utworzyć konto"
            : "Podaj swój adres e-mail, aby się zalogować"}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {formState.error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>{formState.error}</p>
            </div>
          )}

          {/* Email Input */}
          <EmailInput
            value={formState.email}
            onChange={handleEmailChange}
            error={emailError}
            disabled={isDisabled}
            description={
              formState.mode === "signup"
                ? "Na ten adres wyślemy link do utworzenia konta"
                : "Na ten adres wyślemy link do logowania"
            }
          />

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            disabled={isDisabled || !formState.email.trim()}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Send className="size-4" aria-hidden="true" />
                {SUBMIT_BUTTON_LABELS[formState.mode]}
              </>
            )}
          </Button>

          {/* Mode Toggle */}
          <AuthModeToggle
            mode={formState.mode}
            onModeChange={handleModeChange}
            disabled={isLoading}
          />
        </form>
      </CardContent>
    </Card>
  );
}

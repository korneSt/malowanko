"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailInput } from "./EmailInput";
import { AuthModeToggle } from "./AuthModeToggle";
import {
  validateEmail,
  getAuthErrorMessage,
  type AuthMode,
  type AuthErrorType,
} from "@/src/lib/validations/auth";

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

type FormStatus = "idle" | "loading" | "success" | "error";

interface FormState {
  email: string;
  mode: AuthMode;
  status: FormStatus;
  error: string | null;
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
  description: "Wysłaliśmy link do logowania na podany adres e-mail. Kliknij link w e-mailu, aby zalogować się do aplikacji.",
  note: "Link jest ważny przez 1 godzinę.",
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
  // Form state
  const [formState, setFormState] = useState<FormState>({
    email: initialEmail,
    mode: initialMode,
    status: "idle",
    error: null,
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
        // TODO: Implement actual Server Actions
        // For now, simulate a successful response after a delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Placeholder for Server Action call:
        // const result = formState.mode === 'signup'
        //   ? await signUp(formState.email, redirectTo)
        //   : await signIn(formState.email, redirectTo);
        //
        // if (!result.success) {
        //   throw new Error(result.error || 'Wystąpił błąd');
        // }

        // Success state
        setFormState((prev) => ({
          ...prev,
          status: "success",
          error: null,
        }));

        toast.success("Link wysłany!", {
          description: "Sprawdź swoją skrzynkę e-mail.",
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
    }));
  }, []);

  // Derived state
  const isLoading = formState.status === "loading";
  const isSuccess = formState.status === "success";
  const isDisabled = isLoading || isSuccess;

  // Render success state
  if (isSuccess) {
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
              <p className="text-xs text-muted-foreground">
                {SUCCESS_MESSAGES.note}
              </p>
            </div>
            <div className="pt-2 text-sm text-muted-foreground">
              <span>Wysłano na: </span>
              <span className="font-medium text-foreground">
                {formState.email}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={handleRetry}
              className="mt-4"
            >
              Wyślij ponownie
            </Button>
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

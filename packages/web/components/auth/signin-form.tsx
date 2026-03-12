"use client";

import { AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/lib/i18n/navigation";

interface SigninFormProps {
  callbackUrl?: string;
  error?: string;
  translations: {
    title: string;
    subtitle: string;
    googleButton: string;
    or: string;
    driverLink: string;
    terms: string;
  };
}

export const SigninForm = ({
  callbackUrl,
  error,
  translations: t,
}: SigninFormProps) => {
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: callbackUrl || "/book" });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-3 text-center pb-2">
        <div className="text-2xl font-bold tracking-tight">
          Transfer<span className="text-primary">GR</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>Authentication failed. Please try again.</span>
          </div>
        )}

        <Button
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full h-11 gap-3 text-sm font-medium"
        >
          <svg className="size-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {t.googleButton}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t.or}</span>
          </div>
        </div>

        <Button asChild variant="ghost" className="w-full h-11 text-sm">
          <Link href="/auth/driver">{t.driverLink} &rarr;</Link>
        </Button>
      </CardContent>

      <CardFooter>
        <p className="text-xs text-center text-muted-foreground w-full">
          {t.terms}
        </p>
      </CardFooter>
    </Card>
  );
};

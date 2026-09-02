import { useAuthStore } from "@/api/stores/auth.store"
import { TextShimmerMotion } from "@/components/shadcn-space/radix/animated-text/animated-text-05"
import IntegrationCardDemo from "@/components/shadcn-space/radix/card/card-19"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2, ShieldCheck } from "lucide-react"
import { useEffect } from "react"
import { useLocation, useNavigate, type Location } from "react-router-dom"

type OAuthProvider = "google" | "github"

// L'authentification passe désormais par une redirection pleine page vers
// le provider (contrairement au popup PocketBase, qui gardait l'app
// montée) : le state react-router `location.state.from` ne survit pas au
// aller-retour. On le relaie via sessionStorage pour renvoyer malgré tout
// l'utilisateur sur la page qu'il visitait avant d'être redirigé vers "/".
const REDIRECT_STORAGE_KEY = "organizer:auth-redirect-from"

function GithubMark() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="block shrink-0"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 5.5-2 5.5-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 2.5 5.5 5.5 5.5-.6.6-.6 1.4-.5 2V22" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" className="block">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84a10.13 10.13 0 0 1-4.39 6.65v5.52h7.09c4.15-3.82 6.58-9.45 6.58-16.18"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.09-5.5c-1.97 1.32-4.49 2.1-7.47 2.1-5.75 0-10.62-3.88-12.36-9.1H4.34v5.7A21.99 21.99 0 0 0 24 46"
      />
      <path
        fill="#FBBC05"
        d="M11.64 28.18a13.2 13.2 0 0 1 0-8.36v-5.7H4.34a21.99 21.99 0 0 0 0 19.76z"
      />
      <path
        fill="#EA4335"
        d="M24 9.98c3.24 0 6.15 1.12 8.44 3.3l6.28-6.28C34.91 3.5 29.93 1.5 24 1.5A21.99 21.99 0 0 0 4.34 14.12l7.3 5.7C13.38 14.6 18.25 9.98 24 9.98"
      />
    </svg>
  )
}

function Brand() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <TextShimmerMotion text="Organizer" />
    </div>
  )
}

function OAuthButtons({
  pending,
  error,
  onSignIn,
}: {
  pending: OAuthProvider | null
  error: string | null
  onSignIn: (provider: OAuthProvider) => void
}) {
  return (
    <div className="flex w-full max-w-85 flex-col gap-3">
      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full cursor-pointer"
        disabled={pending !== null}
        onClick={() => onSignIn("google")}
      >
        <span
          className={cn(
            "grid size-6.5 shrink-0 place-items-center rounded-full bg-card",
            pending === "google" && "bg-transparent"
          )}
        >
          {pending === "google" ? (
            <Loader2
              className="size-5 animate-spin text-primary-foreground"
              strokeWidth={2.75}
            />
          ) : (
            <GoogleMark />
          )}
        </span>
        Continuer avec Google
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full cursor-pointer bg-card"
        disabled={pending !== null}
        onClick={() => onSignIn("github")}
      >
        {pending === "github" ? (
          <Loader2 className="size-5 animate-spin" strokeWidth={2.75} />
        ) : (
          <GithubMark />
        )}
        Continuer avec GitHub
      </Button>
    </div>
  )
}

function AccessNote() {
  return (
    <div className="w-full max-w-85">
      <div className="mt-6.5 flex items-center gap-3.5">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[13px] text-neutral-600">accès équipe</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mt-4 flex items-center gap-2 text-[13px] text-neutral-700">
        <ShieldCheck
          className="size-4 shrink-0 text-accent-2-600"
          strokeWidth={2.75}
        />
        Réservé aux comptes de l'organisation
      </div>
    </div>
  )
}

function FooterLinks() {
  return (
    <div className="flex items-center justify-center gap-5.5 text-[13px] text-neutral-600">
      <span>Aide</span>
      <span>Confidentialité</span>
      <span>État du service</span>
    </div>
  )
}

const Authentification = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isValid, pending, error, loginWithOAuth2, clearError } =
    useAuthStore()

  useEffect(() => {
    if (isValid) {
      const storedFrom = sessionStorage.getItem(REDIRECT_STORAGE_KEY)
      sessionStorage.removeItem(REDIRECT_STORAGE_KEY)
      const from =
        storedFrom ??
        (location.state as { from?: Location } | null)?.from?.pathname
      navigate(from ?? "/dashboard", { replace: true })
    }
  }, [isValid, location.state, navigate])

  const handleSignIn = (provider: OAuthProvider) => {
    clearError()
    const from = (location.state as { from?: Location } | null)?.from
    if (from?.pathname) {
      sessionStorage.setItem(REDIRECT_STORAGE_KEY, from.pathname)
    } else {
      sessionStorage.removeItem(REDIRECT_STORAGE_KEY)
    }
    loginWithOAuth2(provider)
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-neutral-200">
      {/* Mobile / small screens */}
      <div className="relative flex min-h-screen flex-col overflow-hidden lg:hidden">
        <div className="absolute -top-47.5 -left-37.5 h-160 w-175 rotate-[-9deg] rounded-[44px] bg-linear-to-br from-neutral-900 via-accent-900 to-neutral-900" />

        <section className="relative mx-4 mt-16 aspect-340/236 rotate-[-4deg] shadow-lg">
          <IntegrationCardDemo />
        </section>

        <section className="relative z-10 -mt-6 flex flex-1 flex-col rounded-t-[38px] bg-card px-6.5 pt-8.5 pb-6 shadow-lg">
          <Brand />

          <div className="my-auto flex flex-col items-center py-2">
            <h1 className="text-center text-[44px] leading-[1.04] tracking-[-0.02em]">
              Bonjour
            </h1>
            <p className="mt-3.5 text-center text-base text-pretty text-neutral-700">
              Connectez-vous pour planifier et suivre vos achats.
            </p>

            <div className="mt-9">
              <OAuthButtons
                pending={pending}
                error={error}
                onSignIn={handleSignIn}
              />
            </div>

            <AccessNote />

            <p className="mt-5.5 text-sm text-neutral-700">
              Pas encore d'accès ?{" "}
              <span className="font-semibold text-accent-700">
                Demander un compte
              </span>
            </p>
          </div>

          <FooterLinks />
        </section>
      </div>

      {/* Desktop / large screens */}
      <div className="hidden h-screen min-w-300 overflow-hidden px-15 py-16.5 lg:block">
        <div className="absolute -top-75 -left-35 h-375 w-290 rotate-[-9deg] overflow-hidden rounded-[56px] bg-linear-to-br from-neutral-900 via-accent-900 to-neutral-900">
          <div className="absolute top-50 left-5 size-115 rounded-full bg-primary opacity-50 blur-[95px]" />
          <div className="absolute bottom-35 left-60 h-100 w-140 rounded-full bg-accent-2-700 opacity-40 blur-[110px]" />
          <div className="absolute top-105 right-15 size-105 rounded-full bg-accent-400 opacity-30 blur-[100px]" />
        </div>

        <div className="relative mx-auto h-189 w-full max-w-270">
          <div className="absolute inset-y-0 right-0 left-15.5 rounded-[44px] bg-card shadow-lg" />

          <section className="absolute top-6.5 left-0 h-176 w-125 rotate-[-4deg] overflow-hidden">
            <IntegrationCardDemo />
          </section>

          <section className="absolute inset-y-0 right-0 flex w-125 flex-col px-11.5 py-8.5">
            <Brand />

            <div className="my-auto flex flex-col items-center py-2">
              <h1 className="text-center text-[60px] leading-[1.04] tracking-[-0.02em]">
                Bonjour
              </h1>
              <p className="mt-3.5 text-center text-base text-pretty text-neutral-700">
                Connectez-vous pour planifier et suivre vos achats.
              </p>

              <div className="mt-9">
                <OAuthButtons
                  pending={pending}
                  error={error}
                  onSignIn={handleSignIn}
                />
              </div>

              <AccessNote />

              <p className="mt-5.5 text-sm text-neutral-700">
                Pas encore d'accès ?{" "}
                <span className="font-semibold text-accent-700">
                  Demander un compte
                </span>
              </p>
            </div>

            <FooterLinks />
          </section>
        </div>
      </div>
    </div>
  )
}
export default Authentification

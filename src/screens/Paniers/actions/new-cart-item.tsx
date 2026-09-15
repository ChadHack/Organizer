"use client"

import { merchantFromUrl, useCartStore } from "@/api/stores/cart.store"
import { RippleSpinner } from "@/components/shadcn-space/radix/spinner/spinner-09"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { ScanSearch, ShoppingBag } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const schema = z.object({
  url: z
    .string()
    .min(1, "Le lien du produit est requis")
    .refine((v) => z.string().url().safeParse(v).success, "Lien invalide"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  merchant: z.string().min(1, "Le marchand est requis"),
  price: z.string().optional(),
  currency: z.string().min(1, "La devise est requise"),
  quantity: z
    .string()
    .min(1, "La quantité est requise")
    .refine((v) => Number(v) >= 1, "La quantité doit être d'au moins 1"),
  image: z
    .string()
    .optional()
    .refine(
      (v) => !v || z.string().url().safeParse(v).success,
      "URL d'image invalide"
    ),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const DEFAULTS: FormValues = {
  url: "",
  name: "",
  merchant: "",
  price: "",
  currency: "XAF",
  quantity: "1",
  image: "",
  notes: "",
}

const inputClass = (hasError?: string) =>
  `h-9 text-sm font-normal text-muted-foreground shadow-xs dark:bg-background ${hasError ? "border-rose-400 bg-background focus-visible:border-rose-400 focus-visible:ring-rose-400/50" : ""}`

export default function NewCartItem({
  open,
  setOpen,
  initialUrl,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  /** URL pré-remplie (Web Share Target ou collage) : le scraping est
   * lancé automatiquement à l'ouverture. */
  initialUrl?: string
}) {
  const createCartItem = useCartStore((s) => s.createCartItem)
  const scrapeProduct = useCartStore((s) => s.scrapeProduct)
  const [scraping, setScraping] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  })

  const imagePreview = useWatch({ control, name: "image" })

  const analyze = async (url: string) => {
    setScraping(true)
    try {
      const scraped = await scrapeProduct(url)
      if (scraped.name) setValue("name", scraped.name, { shouldValidate: true })
      if (scraped.image) setValue("image", scraped.image)
      if (scraped.price !== null) setValue("price", String(scraped.price))
      if (scraped.currency) setValue("currency", scraped.currency)
      setValue("merchant", scraped.merchant || merchantFromUrl(url), {
        shouldValidate: true,
      })
      toast.success("Page produit analysée", {
        description: scraped.price
          ? "Nom, prix et image récupérés — vérifiez avant d'enregistrer"
          : "Prix introuvable — complétez-le manuellement",
      })
    } catch (error) {
      // L'analyse est un confort, pas un prérequis : on pré-remplit au
      // moins le marchand depuis l'URL et on laisse la saisie manuelle.
      setValue("merchant", merchantFromUrl(url), { shouldValidate: true })
      toast.error("Analyse impossible", {
        description:
          error instanceof Error
            ? error.message
            : "Complétez les champs manuellement",
      })
    } finally {
      setScraping(false)
    }
  }

  const handleAnalyze = async () => {
    const valid = await trigger("url")
    if (valid) await analyze(getValues("url"))
  }

  // Ouverture via Web Share Target : l'URL partagée est injectée puis
  // analysée sans action supplémentaire de l'utilisateur.
  useEffect(() => {
    if (!open || !initialUrl) return
    // Différé (même motif que new-article.tsx) : l'analyse déclenche des
    // setState qui ne doivent pas s'exécuter dans le corps de l'effet.
    const id = setTimeout(() => {
      reset({ ...DEFAULTS, url: initialUrl })
      analyze(initialUrl)
    }, 0)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialUrl])

  const onSubmit = async (data: FormValues) => {
    try {
      await createCartItem({
        name: data.name,
        url: data.url,
        merchant: data.merchant,
        image: data.image || null,
        price: data.price ? Number(data.price) : undefined,
        currency: data.currency,
        quantity: Number(data.quantity),
        notes: data.notes || undefined,
      })
      reset(DEFAULTS)
      setOpen(false)
      toast.success("Felicitation!", {
        description: "Article ajouté au panier",
      })
    } catch (error) {
      toast.error("Impossible d'ajouter l'article au panier", {
        description:
          error instanceof Error ? error.message : "Veuillez réessayer",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset(DEFAULTS)
        setOpen(v)
      }}
    >
      <DialogContent
        className="gap-6 sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <DialogHeader className="space-y-1">
            <DialogTitle>Panier</DialogTitle>
            <DialogDescription>
              Collez le lien d'un produit — les informations sont récupérées
              automatiquement
            </DialogDescription>
          </DialogHeader>

          <Field className="gap-1.5">
            <FieldLabel
              htmlFor="cart-url"
              className="text-sm font-normal text-muted-foreground"
            >
              Lien du produit <span className="text-rose-500">*</span>
            </FieldLabel>
            <div className="flex gap-2">
              <Input
                id="cart-url"
                type="url"
                placeholder="https://www.exemple.com/produit"
                {...register("url")}
                className={inputClass(errors.url?.message)}
              />
              <Button
                type="button"
                variant="outline"
                className="h-9 shrink-0 gap-2"
                onClick={handleAnalyze}
                disabled={scraping}
              >
                {scraping ? (
                  <RippleSpinner size="sm" />
                ) : (
                  <ScanSearch className="size-4" />
                )}
                Analyser
              </Button>
            </div>
            <FieldError errors={[errors.url]} />
          </Field>

          <div className="flex gap-4">
            {imagePreview && (
              <img
                src={imagePreview}
                alt=""
                className="size-24 shrink-0 rounded-lg border border-border object-cover"
                onError={() => setValue("image", "")}
              />
            )}
            <div className="flex grow flex-col gap-4">
              <Field className="gap-1.5">
                <FieldLabel
                  htmlFor="cart-name"
                  className="text-sm font-normal text-muted-foreground"
                >
                  Nom <span className="text-rose-500">*</span>
                </FieldLabel>
                <Input
                  id="cart-name"
                  type="text"
                  placeholder="Nom du produit"
                  {...register("name")}
                  className={inputClass(errors.name?.message)}
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel
                  htmlFor="cart-merchant"
                  className="text-sm font-normal text-muted-foreground"
                >
                  Marchand <span className="text-rose-500">*</span>
                </FieldLabel>
                <Input
                  id="cart-merchant"
                  type="text"
                  placeholder="amazon.fr, aliexpress.com…"
                  {...register("merchant")}
                  className={inputClass(errors.merchant?.message)}
                />
                <FieldError errors={[errors.merchant]} />
              </Field>
            </div>
          </div>

          <div className="flex gap-4">
            <Field className="gap-1.5">
              <FieldLabel
                htmlFor="cart-price"
                className="text-sm font-normal text-muted-foreground"
              >
                Prix
              </FieldLabel>
              <Input
                id="cart-price"
                type="number"
                min={0}
                step="any"
                placeholder="0"
                {...register("price")}
                className={inputClass(errors.price?.message)}
              />
              <FieldError errors={[errors.price]} />
            </Field>
            <Field className="w-24 shrink-0 gap-1.5">
              <FieldLabel
                htmlFor="cart-currency"
                className="text-sm font-normal text-muted-foreground"
              >
                Devise
              </FieldLabel>
              <Input
                id="cart-currency"
                type="text"
                placeholder="XAF"
                {...register("currency")}
                className={inputClass(errors.currency?.message)}
              />
              <FieldError errors={[errors.currency]} />
            </Field>
            <Field className="w-24 shrink-0 gap-1.5">
              <FieldLabel
                htmlFor="cart-quantity"
                className="text-sm font-normal text-muted-foreground"
              >
                Quantité
              </FieldLabel>
              <Input
                id="cart-quantity"
                type="number"
                min={1}
                {...register("quantity")}
                className={inputClass(errors.quantity?.message)}
              />
              <FieldError errors={[errors.quantity]} />
            </Field>
          </div>

          <Field className="gap-1.5">
            <FieldLabel
              htmlFor="cart-notes"
              className="text-sm font-normal text-muted-foreground"
            >
              Notes
            </FieldLabel>
            <Textarea
              id="cart-notes"
              placeholder="Taille, couleur, code promo…"
              {...register("notes")}
              className="text-sm font-normal text-muted-foreground shadow-xs dark:bg-background"
            />
          </Field>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" className="gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <RippleSpinner size="sm" />
              ) : (
                <ShoppingBag className="size-4" />
              )}
              Ajouter au panier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type { Article } from "@/api/interfaces/article.interface"
import { useActionStore } from "@/api/stores/action.store"
import { useArticleStore } from "@/api/stores/article.store"
import FileUpload from "@/components/shadcn-space/radix/file-upload/file-upload-01"
import RippleSpinner from "@/components/shadcn-space/radix/spinner/spinner-09"
import { StepperIndicator } from "@/components/stepper-indicator"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Package } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const schema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  quantity: z
    .string()
    .min(1, "La quantité est requise")
    .refine((v) => Number(v) >= 1, "La quantité doit être d'au moins 1"),
  price: z.string().optional(),
  link: z
    .string()
    .optional()
    .refine(
      (v) => !v || z.string().url().safeParse(v).success,
      "Lien invalide"
    ),
  imageUrl: z
    .string()
    .optional()
    .refine(
      (v) => !v || z.string().url().safeParse(v).success,
      "URL d'image invalide"
    ),
  estimateDate: z.string().min(1, "La date estimée est requise"),
  priorityId: z.string().min(1, "La priorité est requise"),
  actionId: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const STEPS = ["Informations", "Détails"]
const STEP_FIELDS: (keyof FormValues)[][] = [
  ["name", "description", "quantity", "price", "estimateDate"],
  ["link", "imageUrl", "actionId"],
]

export default function UpdateArticle({
  article,
  open,
  setOpen,
}: {
  article: Article
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const updateArticle = useArticleStore((s) => s.updateArticle)
  const { actions, fetchActions } = useActionStore()
  const [file, setFile] = useState<File[]>([])
  const [imageMode, setImageMode] = useState<"upload" | "url">(
    article.imageUrl ? "url" : "upload"
  )
  const [step, setStep] = useState(0)

  useEffect(() => {
    fetchActions()
  }, [fetchActions])

  const {
    register,
    handleSubmit,
    control,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: article.name,
      description: article.description,
      quantity: String(article.quantity),
      price: article.price !== undefined ? String(article.price) : "",
      link: article.link ?? "",
      imageUrl: article.imageUrl ?? "",
      estimateDate: format(article.estimateDate, "yyyy-MM-dd"),
      priorityId: article.priorityId,
      actionId: article.actionId ?? "",
    },
  })

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => s - 1)

  const onSubmit = async (data: FormValues) => {
    try {
      await updateArticle(article.id, {
        name: data.name,
        description: data.description,
        quantity: Number(data.quantity),
        price: data.price ? Number(data.price) : undefined,
        link: data.link || undefined,
        status: "En attente",
        estimateDate: new Date(data.estimateDate),
        actionId: data.actionId || undefined,
        ...(imageMode === "url"
          ? {
              imageUrl: data.imageUrl || undefined,
              ...(article.image && !article.imageUrl ? { image: null } : {}),
            }
          : {
              ...(file[0] ? { image: file[0] } : {}),
              ...(file[0] && article.imageUrl ? { imageUrl: "" } : {}),
            }),
      })
      reset()
      setFile([])
      setImageMode("upload")
      setStep(0)
      setOpen(false)
      toast.success("Felicitation!", {
        description: "Article mis à jour avec succès",
      })
    } catch (error) {
      toast.error("Impossible de mettre à jour l'article", {
        description:
          error instanceof Error ? error.message : "Veuillez réessayer",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset()
          setFile([])
          setImageMode(article.imageUrl ? "url" : "upload")
          setStep(0)
        }
        setOpen(v)
      }}
    >
      <DialogContent
        className="gap-6 sm:max-w-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            if (step === STEPS.length - 1) handleSubmit(onSubmit)()
          }}
        >
          <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <DialogTitle>Article</DialogTitle>
              <DialogDescription>Ajouter un nouvel article</DialogDescription>
            </div>
          </DialogHeader>
          <StepperIndicator steps={STEPS} currentStep={step} />
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="order-last w-full max-w-md border-border sm:order-first sm:border-e md:pe-10">
              {step === 0 && (
                <div className="flex flex-col gap-4">
                  <Field className="gap-1.5">
                    <FieldLabel
                      htmlFor="name"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Nom
                    </FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Nom de l'article"
                      {...register("name")}
                      className={`h-9 text-sm font-normal text-muted-foreground shadow-xs dark:bg-background ${errors.name?.message && "border-rose-400 bg-background focus-visible:border-rose-400 focus-visible:ring-rose-400/50"}`}
                    />
                    <FieldError errors={[errors.name]} />
                  </Field>
                  <Field className="gap-1.5">
                    <FieldLabel
                      htmlFor="description"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Description
                    </FieldLabel>
                    <Textarea
                      id="description"
                      placeholder="Description de l'article"
                      {...register("description")}
                      className={`text-sm font-normal text-muted-foreground shadow-xs dark:bg-background ${errors.description?.message && "border-rose-400 bg-background focus-visible:border-rose-400 focus-visible:ring-rose-400/50"}`}
                    />
                    <FieldError errors={[errors.description]} />
                  </Field>
                  <div className="flex gap-4">
                    <Field className="gap-1.5">
                      <FieldLabel
                        htmlFor="quantity"
                        className="text-sm font-normal text-muted-foreground"
                      >
                        Quantité
                      </FieldLabel>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        placeholder="1"
                        {...register("quantity")}
                        className={`h-9 text-sm font-normal text-muted-foreground shadow-xs dark:bg-background ${errors.quantity?.message && "border-rose-400 bg-background focus-visible:border-rose-400 focus-visible:ring-rose-400/50"}`}
                      />
                      <FieldError errors={[errors.quantity]} />
                    </Field>
                    <Field className="gap-1.5">
                      <FieldLabel
                        htmlFor="price"
                        className="text-sm font-normal text-muted-foreground"
                      >
                        Prix
                      </FieldLabel>
                      <Input
                        id="price"
                        type="number"
                        min={0}
                        placeholder="Prix de l'article"
                        {...register("price")}
                        className="h-9 text-sm font-normal text-muted-foreground shadow-xs dark:bg-background"
                      />
                      <FieldError errors={[errors.price]} />
                    </Field>
                  </div>
                  <Field className="gap-1.5">
                    <FieldLabel
                      htmlFor="estimateDate"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Date estimée
                    </FieldLabel>
                    <Input
                      id="estimateDate"
                      type="date"
                      {...register("estimateDate")}
                      className={`h-9 text-sm font-normal text-muted-foreground shadow-xs dark:bg-background ${errors.estimateDate?.message && "border-rose-400 bg-background focus-visible:border-rose-400 focus-visible:ring-rose-400/50"}`}
                    />
                    <FieldError errors={[errors.estimateDate]} />
                  </Field>
                </div>
              )}
              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <Field className="gap-1.5">
                    <FieldLabel
                      htmlFor="link"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Lien
                    </FieldLabel>
                    <Input
                      id="link"
                      type="url"
                      placeholder="https://..."
                      {...register("link")}
                      className={`h-9 text-sm font-normal text-muted-foreground shadow-xs dark:bg-background ${errors.link?.message && "border-rose-400 bg-background focus-visible:border-rose-400 focus-visible:ring-rose-400/50"}`}
                    />
                    <FieldError errors={[errors.link]} />
                  </Field>
                  <div className="flex gap-4">
                    <Field className="gap-1.5">
                      <FieldLabel
                        htmlFor="actionId"
                        className="text-sm font-normal text-muted-foreground"
                      >
                        Action liée
                      </FieldLabel>
                      <Controller
                        name="actionId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={(field.value as string) ?? ""}
                          >
                            <SelectTrigger
                              className={`w-full ${errors.actionId?.message && "border-rose-400 bg-background focus-visible:border-rose-400 focus-visible:ring-rose-400/50"}`}
                            >
                              <SelectValue placeholder="Action">
                                {
                                  actions.find(
                                    (action) => action.id === field.value
                                  )?.name
                                }
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {actions.map((a) => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </Field>
                  </div>
                  <Field className="gap-1.5">
                    <FieldLabel className="text-sm font-normal text-muted-foreground">
                      Image
                    </FieldLabel>
                    <Tabs
                      value={imageMode}
                      onValueChange={(v) => setImageMode(v as "upload" | "url")}
                    >
                      <TabsList className="w-full">
                        <TabsTrigger value="upload">
                          Téléverser un fichier
                        </TabsTrigger>
                        <TabsTrigger value="url">Lien (URL)</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload">
                        <FileUpload setFile={setFile} />
                      </TabsContent>
                      <TabsContent value="url">
                        <Input
                          id="imageUrl"
                          type="url"
                          placeholder="https://exemple.com/image.png"
                          {...register("imageUrl")}
                          className={`h-9 text-sm font-normal text-muted-foreground shadow-xs dark:bg-background ${errors.imageUrl?.message && "border-rose-400 bg-background focus-visible:border-rose-400 focus-visible:ring-rose-400/50"}`}
                        />
                        <FieldError errors={[errors.imageUrl]} />
                      </TabsContent>
                    </Tabs>
                  </Field>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h6 className="text-sm font-medium text-primary">
                    {article.name}
                  </h6>
                  <p className="text-sm font-normal text-muted-foreground">
                    {article.description}
                  </p>
                </div>
                {article.image ? (
                  <img
                    src={article.image}
                    className="mx-auto size-full rounded-2xl"
                  />
                ) : (
                  <Package className="mx-auto size-24 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            {step === 0 ? (
              <>
                <DialogClose asChild>
                  <Button variant="outline">Fermer</Button>
                </DialogClose>
                <Button type="button" onClick={handleNext}>
                  Suivant
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleBack}>
                  Précédent
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(onSubmit)()}
                >
                  <RippleSpinner
                    size="sm"
                    className={isSubmitting ? "flex" : "hidden"}
                  />
                  Modifier
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

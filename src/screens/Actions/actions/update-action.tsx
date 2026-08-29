"use client"

import type { Action } from "@/api/interfaces/action.interface"
import { useActionStore } from "@/api/stores/action.store"
import { RippleSpinner } from "@/components/shadcn-space/radix/spinner/spinner-09"
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
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { Crosshair } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(4, "Le nom doit contenir au moins 4 caractères"),
  description: z.string().optional(),
  status: z.enum(["En attente", "En cours", "Terminée", "Annulée"]),
})

type FormValues = z.infer<typeof schema>

export default function UpdateAction({
  action,
  open,
  setOpen,
}: {
  action: Action
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const updateAction = useActionStore((s) => s.updateAction)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: action.name,
      description: action.description,
      status: action.status,
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await updateAction(action.id, data)
      reset()
      setOpen(false)
      toast.success("Felicitation!", {
        description: "Action mise à jour avec succès",
      })
    } catch (error) {
      toast.error("Impossible de mettre à jour une action", {
        description:
          error instanceof Error ? error.message : "Veuillez réessayer",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        setOpen(v)
      }}
    >
      <DialogContent
        className="gap-6 sm:max-w-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <DialogTitle>Action</DialogTitle>
              <DialogDescription>Ajouter une nouvelle action</DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="order-last w-full max-w-md border-border sm:order-first sm:border-e md:pe-10">
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
                    placeholder="Nom de l'action"
                    {...register("name")}
                    className={`h-9 text-sm font-normal text-muted-foreground shadow-xs dark:bg-background ${errors.name?.message && "border-rose-400 bg-background focus-visible:border-rose-400 focus-visible:ring-rose-400/50"}`}
                    required
                  />
                  <FieldError errors={[errors.name]} />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel
                    htmlFor="name"
                    className="text-sm font-normal text-muted-foreground"
                  >
                    Description
                  </FieldLabel>
                  <Textarea
                    id="description"
                    placeholder="Description de l'action"
                    {...register("description")}
                    className={`text-sm font-normal text-muted-foreground shadow-xs dark:bg-background ${errors.description?.message && "border-rose-400 bg-background focus-visible:border-rose-400 focus-visible:ring-rose-400/50"}`}
                    required
                  />
                  <FieldError errors={[errors.description]} />
                </Field>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h6 className="text-sm font-medium text-primary">
                    {action.name}
                  </h6>
                  <p className="text-sm font-normal text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <Crosshair className="mx-auto size-24" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fermer</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              <RippleSpinner
                size="sm"
                className={isSubmitting ? "flex" : "hidden"}
              />
              Modifier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/// <reference path="../pb_data/types.d.ts" />
// Retire "Avortée" des valeurs autorisées du statut d'action : jamais
// exposée côté frontend (type, formulaires, filtres) ni protégée par la
// synchro action/articles (pb_hooks/lib/article-action-sync.cjs), et
// aucun enregistrement existant ne l'utilise — valeur orpheline.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("actions")
    const field = collection.fields.getByName("status")
    field.values = ["En attente", "En cours", "Terminée", "Annulée"]
    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("actions")
    const field = collection.fields.getByName("status")
    field.values = ["En attente", "En cours", "Terminée", "Annulée", "Avortée"]
    return app.save(collection)
  }
)

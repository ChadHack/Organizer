/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("articles")
    const field = collection.fields.getByName("status")
    field.values = ["En attente", "En cours", "Bouclé", "Annulé"]
    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("articles")
    const field = collection.fields.getByName("status")
    field.values = ["En attente", "Bouclé", "Annulée"]
    return app.save(collection)
  }
)

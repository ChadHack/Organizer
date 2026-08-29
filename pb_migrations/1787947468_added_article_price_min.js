/// <reference path="../pb_data/types.d.ts" />
// articles.price n'avait aucune borne (contrairement à actions.cost, qui a
// min: 0 depuis 1787900001) : un prix négatif était schema-légal.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("articles")
    const field = collection.fields.getByName("price")
    field.min = 0
    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("articles")
    const field = collection.fields.getByName("price")
    field.min = null
    return app.save(collection)
  }
)

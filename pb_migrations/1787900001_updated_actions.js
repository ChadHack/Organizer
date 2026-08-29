/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("actions")

    collection.fields.add(
      new Field({
        name: "cost",
        type: "number",
        required: false,
        min: 0,
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("actions")
    collection.fields.removeByName("cost")
    return app.save(collection)
  }
)

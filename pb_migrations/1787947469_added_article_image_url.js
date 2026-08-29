/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("articles")

    collection.fields.add(
      new Field({
        name: "imageUrl",
        type: "url",
        required: false,
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("articles")
    collection.fields.removeByName("imageUrl")
    return app.save(collection)
  }
)

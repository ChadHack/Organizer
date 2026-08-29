/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_2484833797")

    // update field
    collection.fields.addAt(
      2,
      new Field({
        help: "",
        hidden: false,
        id: "select2063623452",
        maxSelect: 1,
        name: "status",
        presentable: false,
        required: true,
        system: false,
        type: "select",
        values: ["En attente", "En cours", "Terminée", "Annulée", "Avortée"],
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_2484833797")

    // update field
    collection.fields.addAt(
      2,
      new Field({
        help: "",
        hidden: false,
        id: "select2063623452",
        maxSelect: 1,
        name: "status",
        presentable: false,
        required: true,
        system: false,
        type: "select",
        values: ["En attente", "En cours", "Terminée", "Annulée", "Avortée"],
      })
    )

    return app.save(collection)
  }
)

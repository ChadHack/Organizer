migrate(
  (app) => {
    const collection = new Collection({
      name: "actions",
      type: "base",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "status",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["En attente", "En cours", "Terminée", "Annulée", "Avortée"],
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false,
        },
        {
          name: "updated",
          type: "autodate",
          onCreate: true,
          onUpdate: true,
        },
      ],
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("actions")
    app.delete(collection)
  }
)

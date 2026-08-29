migrate(
  (app) => {
    const priorities = app.findCollectionByNameOrId("priorities")
    const actions = app.findCollectionByNameOrId("actions")

    const collection = new Collection({
      name: "articles",
      type: "base",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "text",
          required: true,
        },
        {
          name: "image",
          type: "file",
          required: false,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        },
        {
          name: "link",
          type: "url",
          required: false,
        },
        {
          name: "price",
          type: "number",
          required: false,
        },
        {
          name: "quantity",
          type: "number",
          required: true,
        },
        {
          name: "status",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["En attente", "Bouclé", "Annulée"],
        },
        {
          name: "estimateDate",
          type: "date",
          required: true,
        },
        {
          name: "priority",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: priorities.id,
          cascadeDelete: false,
        },
        {
          name: "action",
          type: "relation",
          required: false,
          maxSelect: 1,
          collectionId: actions.id,
          cascadeDelete: false,
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
    const collection = app.findCollectionByNameOrId("articles")
    app.delete(collection)
  }
)

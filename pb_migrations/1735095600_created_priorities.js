migrate(
  (app) => {
    const collection = new Collection({
      name: "priorities",
      type: "base",
      fields: [
        {
          name: "priority",
          type: "number",
          required: true,
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
    const collection = app.findCollectionByNameOrId("priorities")
    app.delete(collection)
  }
)

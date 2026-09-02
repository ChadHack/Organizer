/// <reference path="../pb_data/types.d.ts" />
// Les collections "actions", "articles" et "priorities" n'ont jamais eu de
// règles d'API : listRule/viewRule/createRule/updateRule/deleteRule sont
// restées à "" (= accès public, sans authentification) depuis leur création
// dans 1735095600/01/02_created_*.js. N'importe qui sur Internet pouvait donc
// lister, lire, créer, modifier ou supprimer ces données via l'API REST,
// sans jamais se connecter. On restreint l'accès aux comptes authentifiés,
// ce qui correspond à l'usage réel de l'app : toutes les routes qui
// consomment ces collections sont derrière <RequireAuth /> (src/App.tsx) et
// aucun écran public n'y accède.
const AUTHENTICATED = "@request.auth.id != ''"
const COLLECTIONS = ["actions", "articles", "priorities"]

migrate(
  (app) => {
    for (const name of COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(name)
      collection.listRule = AUTHENTICATED
      collection.viewRule = AUTHENTICATED
      collection.createRule = AUTHENTICATED
      collection.updateRule = AUTHENTICATED
      collection.deleteRule = AUTHENTICATED
      app.save(collection)
    }
  },
  (app) => {
    for (const name of COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(name)
      collection.listRule = ""
      collection.viewRule = ""
      collection.createRule = ""
      collection.updateRule = ""
      collection.deleteRule = ""
      app.save(collection)
    }
  }
)

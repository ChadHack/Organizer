/// <reference path="../pb_data/types.d.ts" />
// La collection "users" (_pb_users_auth_) n'a jamais eu de règles explicites
// pour list/view/update/delete : aucune migration ne les a jamais posées, et
// PocketBase gardait donc les valeurs par défaut posées à la création du
// projet (auto-générées, hors du dossier de migrations). Côté front, l'écran
// /utilisateurs (gestion des membres : activer/désactiver, supprimer — cf.
// src/screens/Users/) n'était protégé par aucun garde-fou "admin" (seul le
// lien de nav était masqué aux non-admins dans App-layout.tsx, pas la
// route elle-même ni l'API) : n'importe quel compte connecté, pas seulement
// un administrateur, pouvait désactiver, supprimer ou — via un appel direct à
// l'API — promouvoir n'importe quel autre compte en admin.
//
// - listRule/viewRule restent ouverts à tout compte authentifié : plusieurs
//   écrans (Dashboard, Articles, Actions, Priorités) expand la relation
//   "user" de records appartenant à d'autres membres de l'organisation, et
//   restreindre la lecture casserait l'affichage du nom du propriétaire.
// - updateRule/deleteRule sont réservés aux admins : aucun écran actuel ne
//   permet à un utilisateur de modifier son propre profil (User-profile.tsx
//   est en lecture seule), donc cela ne change aucun comportement pour les
//   membres normaux, et ferme le trou de privilège ci-dessus.
// - createRule n'est volontairement PAS modifié ici : il gouverne le
//   provisioning automatique du compte par authWithOAuth2() au premier
//   login (cf. src/api/stores/auth.store.ts). Le modifier sans pouvoir
//   tester contre une instance PocketBase réelle risquerait de bloquer
//   toute nouvelle connexion — à vérifier manuellement dans le dashboard
//   PocketBase avant d'y toucher.
const collectionName = "_pb_users_auth_"
const AUTHENTICATED = "@request.auth.id != ''"
const ADMIN_ONLY = "@request.auth.isAdmin = true"
// Valeurs par défaut posées par PocketBase à la création d'une collection
// d'auth, utilisées ici comme état de retour en arrière.
const SELF_ONLY = "id = @request.auth.id"

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId(collectionName)
    collection.listRule = AUTHENTICATED
    collection.viewRule = AUTHENTICATED
    collection.updateRule = ADMIN_ONLY
    collection.deleteRule = ADMIN_ONLY
    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId(collectionName)
    collection.listRule = SELF_ONLY
    collection.viewRule = SELF_ONLY
    collection.updateRule = SELF_ONLY
    collection.deleteRule = SELF_ONLY
    return app.save(collection)
  }
)

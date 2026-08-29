/// <reference path="../pb_data/types.d.ts" />
// Les valeurs "status" des articles ont été renommées ("Boucler" -> "Bouclé",
// "Annulée" -> "Annulé") dans 1787900000_updated_articles.js, mais la mise à
// jour de la liste des valeurs autorisées d'un champ select ne réécrit pas
// les enregistrements existants : on migre ici les anciennes valeurs.
const RENAMES = { Boucler: "Bouclé", Annulée: "Annulé" }

migrate(
  (app) => {
    const records = app.findRecordsByFilter("articles", "", "", 0, 0)
    for (const record of records) {
      const renamed = RENAMES[record.get("status")]
      if (!renamed) continue
      record.set("status", renamed)
      app.save(record)
    }
  },
  (app) => {
    const REVERT = { Bouclé: "Boucler", Annulé: "Annulée" }
    const records = app.findRecordsByFilter("articles", "", "", 0, 0)
    for (const record of records) {
      const renamed = REVERT[record.get("status")]
      if (!renamed) continue
      record.set("status", renamed)
      app.save(record)
    }
  }
)

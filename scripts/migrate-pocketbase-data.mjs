#!/usr/bin/env node
/**
 * Migration ponctuelle des données PocketBase existantes (pb_data/) vers
 * Supabase. À exécuter UNE SEULE FOIS, avant la suppression de pb_data/,
 * contre un schéma Supabase fraîchement créé (supabase/schema.sql déjà
 * exécuté).
 *
 * Usage :
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-pocketbase-data.mjs
 *
 * La clé service_role (Dashboard Supabase → Settings → API) ne doit être
 * utilisée qu'ici, jamais commitée ni ajoutée à .env.local.
 */

import { createClient } from "@supabase/supabase-js"
import { execFileSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DB_PATH = path.join(ROOT, "pb_data", "data.db")
const STORAGE_ROOT = path.join(ROOT, "pb_data", "storage")

const USERS_COLLECTION_ID = "_pb_users_auth_"
const ARTICLES_COLLECTION_ID = "pbc_4287850865"

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://cudjrkygmwxnzeofqald.supabase.co"
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY manquant. Récupère-la dans Dashboard Supabase " +
      "→ Settings → API, et lance :\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-pocketbase-data.mjs"
  )
  process.exit(1)
}

if (!existsSync(DB_PATH)) {
  console.error(`Introuvable : ${DB_PATH} (pb_data/ a-t-il déjà été supprimé ?)`)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function sqliteJson(query) {
  const out = execFileSync("sqlite3", ["-json", DB_PATH, query], {
    encoding: "utf8",
  })
  return out.trim() ? JSON.parse(out) : []
}

/** Le fichier original d'un champ file PocketBase, en écartant les
 * variantes générées (thumbs_*) et les sidecars *.attrs. */
function findStoredFile(collectionId, recordId, filename) {
  const dir = path.join(STORAGE_ROOT, collectionId, recordId)
  if (!existsSync(dir)) return null
  const match = readdirSync(dir).find(
    (f) => f === filename && !f.endsWith(".attrs")
  )
  return match ? path.join(dir, match) : null
}

async function uploadFile(bucket, destPath, filePath, contentType) {
  const body = readFileSync(filePath)
  const { error } = await supabase.storage
    .from(bucket)
    .upload(destPath, body, { contentType, upsert: true })
  if (error) throw error
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(destPath)
  return publicUrl
}

function guessContentType(filename) {
  const ext = path.extname(filename).toLowerCase()
  return (
    { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
      ".webp": "image/webp", ".gif": "image/gif" }[ext] ??
    "application/octet-stream"
  )
}

async function migrateUsers() {
  const rows = sqliteJson(
    `SELECT id, name, email, avatar, "isAdmin", status, created, updated FROM users;`
  )
  const idMap = {}

  for (const row of rows) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: row.email,
      email_confirm: true,
      user_metadata: { full_name: row.name },
    })
    if (error) throw new Error(`createUser(${row.email}): ${error.message}`)

    const newId = created.user.id
    idMap[row.id] = newId

    let avatarUrl = null
    if (row.avatar) {
      const filePath = findStoredFile(USERS_COLLECTION_ID, row.id, row.avatar)
      if (filePath) {
        avatarUrl = await uploadFile(
          "avatars",
          `${newId}-${row.avatar}`,
          filePath,
          guessContentType(row.avatar)
        )
      } else {
        console.warn(`  ! avatar introuvable sur disque pour ${row.email}`)
      }
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        name: row.name,
        "isAdmin": !!row.isAdmin,
        status: !!row.status,
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
        created: row.created,
        updated: row.updated,
      })
      .eq("id", newId)
    if (updateError) throw updateError

    console.log(`  ✓ user ${row.email} -> ${newId}`)
  }

  return idMap
}

async function migratePriorities() {
  // Une priorité n'a pas de propriétaire (pas de colonne "user" côté
  // Supabase) — on ignore volontairement l'ancien champ "user" de
  // PocketBase, déjà vide sur tous les enregistrements existants.
  const rows = sqliteJson(`SELECT id, priority, created, updated FROM priorities;`)
  const idMap = {}

  for (const row of rows) {
    const newId = randomUUID()
    idMap[row.id] = newId

    const { error } = await supabase.from("priorities").insert({
      id: newId,
      priority: row.priority,
      created: row.created,
      updated: row.updated,
    })
    if (error) throw error
  }

  console.log(`  ✓ ${rows.length} priorité(s) migrée(s)`)
  return idMap
}

async function migrateActions(userIdMap) {
  const rows = sqliteJson(
    `SELECT id, name, description, status, "user", created, updated FROM actions;`
  )
  const idMap = {}

  for (const row of rows) {
    const newId = randomUUID()
    idMap[row.id] = newId
    const { error } = await supabase.from("actions").insert({
      id: newId,
      name: row.name,
      description: row.description || null,
      status: row.status,
      // cost recalculé automatiquement par le trigger dès l'insertion des
      // articles liés (voir migrateArticles) — 0 est juste un placeholder.
      cost: 0,
      user: userIdMap[row.user],
      created: row.created,
      updated: row.updated,
    })
    if (error) throw error
  }

  console.log(`  ✓ ${rows.length} action(s) migrée(s)`)
  return idMap
}

async function migrateArticles(userIdMap, priorityIdMap, actionIdMap) {
  const rows = sqliteJson(
    `SELECT id, name, description, image, "imageUrl", link, price, quantity,
            status, estimateDate, priority, action, "user", created, updated
     FROM articles;`
  )

  let imagesUploaded = 0

  for (const row of rows) {
    let imageUrl = null
    if (row.image) {
      const filePath = findStoredFile(ARTICLES_COLLECTION_ID, row.id, row.image)
      if (filePath) {
        imageUrl = await uploadFile(
          "article-images",
          `${randomUUID()}-${row.image}`,
          filePath,
          guessContentType(row.image)
        )
        imagesUploaded += 1
      } else {
        console.warn(`  ! image introuvable sur disque pour l'article ${row.id}`)
      }
    }

    const priorityId = priorityIdMap[row.priority]
    if (!priorityId) {
      throw new Error(`article ${row.id} référence une priorité introuvable (${row.priority})`)
    }

    const { error } = await supabase.from("articles").insert({
      id: randomUUID(),
      name: row.name,
      description: row.description,
      image: imageUrl,
      imageUrl: row.imageUrl || null,
      link: row.link || null,
      price: row.price || null,
      quantity: row.quantity,
      status: row.status,
      estimateDate: row.estimateDate,
      priority: priorityId,
      action: row.action ? (actionIdMap[row.action] ?? null) : null,
      user: userIdMap[row.user],
      created: row.created,
      updated: row.updated,
    })
    if (error) throw error
  }

  console.log(`  ✓ ${rows.length} article(s) migré(s) (${imagesUploaded} image(s) re-hébergée(s))`)
}

async function main() {
  console.log("Migration PocketBase -> Supabase\n")

  console.log("Utilisateurs...")
  const userIdMap = await migrateUsers()

  console.log("Priorités...")
  const priorityIdMap = await migratePriorities()

  console.log("Actions...")
  const actionIdMap = await migrateActions(userIdMap)

  console.log("Articles...")
  await migrateArticles(userIdMap, priorityIdMap, actionIdMap)

  console.log("\nTerminé. Vérifie les données dans le Table Editor Supabase avant de supprimer pb_data/.")
}

main().catch((err) => {
  console.error("\nÉchec de la migration :", err.message)
  process.exit(1)
})

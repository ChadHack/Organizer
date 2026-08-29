import type { Article } from "@/api/interfaces/article.interface"
import { pb } from "@/lib/pocketbase"
import { fmtPrice } from "@/lib/utils"
import { Workbook } from "exceljs"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

const dateFormatter = new Intl.DateTimeFormat("fr-FR")

function formatDate(date: Date) {
  return dateFormatter.format(date)
}

function timestamp() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * jsPDF's standard fonts only support Latin-1 codepoints and mangle
 * characters outside that range (e.g. the narrow no-break space used by
 * `toLocaleString("fr-FR")` as a thousands separator renders as "/").
 */
function pdfSafeText(text: string) {
  return text.replace(/[  ]/g, " ")
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Product image CDNs (e.g. media.takealot.com) don't send
 * Access-Control-Allow-Origin, so the browser refuses to read their pixels
 * into a canvas. Route those through wsrv.nl, a public image proxy that
 * re-serves the image with permissive CORS headers. Our own PocketBase
 * files already have CORS enabled, so they're loaded directly.
 */
function toExportableImageUrl(url: string) {
  try {
    if (new URL(url).origin === new URL(pb.baseUrl).origin) return url
  } catch {
    // Relative or malformed URL: fall through and let the proxy attempt it.
  }
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}`
}

/**
 * Loads a (possibly cross-origin) image and re-encodes it as a PNG data URL
 * via canvas, so both exceljs and jsPDF always receive a format they support.
 */
function loadImageAsPngDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL("image/png"))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

async function loadArticleImages(articles: Article[]) {
  return Promise.all(
    articles.map((article) => {
      const imageUrl = article.image ?? article.imageUrl
      return imageUrl
        ? loadImageAsPngDataUrl(toExportableImageUrl(imageUrl))
        : Promise.resolve(null)
    })
  )
}

export async function exportArticlesToExcel(articles: Article[]) {
  const images = await loadArticleImages(articles)

  const workbook = new Workbook()
  workbook.creator = "Organizer"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet("Articles")
  sheet.columns = [
    { header: "Image", key: "image", width: 16 },
    { header: "Nom", key: "name", width: 28 },
    { header: "Description", key: "description", width: 40 },
    { header: "Statut", key: "status", width: 14 },
    { header: "Priorité", key: "priority", width: 12 },
    { header: "Action", key: "action", width: 18 },
    { header: "Quantité", key: "quantity", width: 12 },
    { header: "Prix", key: "price", width: 14 },
    { header: "Date estimée", key: "estimateDate", width: 16 },
    { header: "Lien", key: "link", width: 32 },
  ]
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" }

  const ROW_HEIGHT = 64

  articles.forEach((article, index) => {
    const row = sheet.addRow({
      image: "",
      name: article.name,
      description: article.description,
      status: article.status,
      priority: article.priority?.priority ?? "N/A",
      action: article.action?.name ?? "N/A",
      quantity: article.quantity,
      price: article.price ? fmtPrice(article.price) : "-",
      estimateDate: formatDate(article.estimateDate),
      link: article.link ?? "",
    })
    row.height = ROW_HEIGHT
    row.alignment = { vertical: "middle" }

    const image = images[index]
    if (image) {
      const imageId = workbook.addImage({ base64: image, extension: "png" })
      const rowIndex = row.number - 1
      sheet.addImage(imageId, {
        tl: { col: 0.2, row: rowIndex + 0.1 },
        ext: { width: 56, height: 56 },
      })
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `articles-${timestamp()}.xlsx`
  )
}

export async function exportArticlesToPdf(articles: Article[]) {
  const images = await loadArticleImages(articles)

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })

  doc.setFontSize(16)
  doc.text("Liste des articles", 40, 40)
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(`Généré le ${formatDate(new Date())}`, 40, 56)
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 70,
    head: [
      [
        "Image",
        "Nom",
        "Statut",
        "Priorité",
        // "Action",
        "Qté",
        "Prix",
        "Lien",
        // "Date estimée",
      ],
    ],
    body: articles.map((article) => [
      "",
      article.name,
      article.status,
      article.priority?.priority !== undefined
        ? String(article.priority.priority)
        : "N/A",
      // article.action?.name ?? "N/A",
      String(article.quantity),
      article.price ? pdfSafeText(fmtPrice(article.price)) : "N/A",
      article.link ?? "N/A",
      // formatDate(article.estimateDate),
    ]),
    styles: { fontSize: 8, cellPadding: 6, valign: "middle" },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 46, minCellHeight: 40 },
      5: { cellWidth: 70 },
    },
    rowPageBreak: "avoid",
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== 0) return
      const image = images[data.row.index]
      if (!image) return
      const size = Math.min(32, data.cell.height - 8)
      const x = data.cell.x + (data.cell.width - size) / 2
      const y = data.cell.y + (data.cell.height - size) / 2
      try {
        doc.addImage(image, "PNG", x, y, size, size)
      } catch {
        // Skip images that fail to encode (unsupported format, corrupted file, ...)
      }
    },
  })

  doc.save(`articles-${timestamp()}.pdf`)
}

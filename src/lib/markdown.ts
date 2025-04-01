const showdown = require("showdown")
const probe = require("probe-image-size")

export async function renderMarkdown(markdown: string): Promise<string> {
  const converter = new showdown.Converter({ metadata: true, tables: true })
  let html = converter.makeHtml(markdown)
  const imgTags = html?.match(/<img [^>]*src="[^"]*"[^>]*>/gm)
  if (imgTags) {
    for (let img of imgTags) {
      if (img.includes('width="')) {
        // Skip images that already have their width/height set
        continue
      }
      const src = img.replace(/.*src="([^"]*)".*/, "$1")
      let result = await probe(src)
      const newImage = img.replace(
        "<img",
        `<img width="${result.width}" height="${result.height}"`
      )
      html = html.replace(img, newImage)
    }
  }
  if (typeof process.env.BASE_PATH !== "undefined") {
    html = html.replaceAll(
      /<a href="\/([a-z-]*)">/g,
      `<a href="${process.env.BASE_PATH}/$1/">`
    )
  }
  return html
}

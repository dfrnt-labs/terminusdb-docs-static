// Generates pre-optimized images for the static export. `output: 'export'`
// has no Next.js image optimizer, so optimized variants are built ahead of
// time and committed. Run after changing a source image: npm run optimize:images
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const imagesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/images',
)

// Add { src, out, width, blur } entries here for source images that need an
// optimized variant committed to the repo.
const targets = []

for (const { src, out, width, blur } of targets) {
  const input = path.join(imagesDir, src)
  const output = path.join(imagesDir, out)
  const info = await sharp(input)
    .resize({ width })
    .blur(blur)
    .webp({ quality: 70 })
    .toFile(output)
  console.log(`${out}: ${info.width}x${info.height}, ${info.size} bytes`)
}

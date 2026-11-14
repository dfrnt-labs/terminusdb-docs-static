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

// Hero blurs render at 530–567 CSS px and contain only smooth gradients with
// fine grain that compresses poorly. A 480px source plus a light pre-blur
// removes the grain and is invisible in the rendered result.
const targets = [
  { src: 'blur-cyan.png', out: 'blur-cyan.webp', width: 480, blur: 1.5 },
  { src: 'blur-indigo.png', out: 'blur-indigo.webp', width: 480, blur: 1.5 },
]

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

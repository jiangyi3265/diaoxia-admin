import fs from 'node:fs'
import path from 'node:path'

const virtualModuleId = 'virtual:svg-icons-register'
const resolvedVirtualModuleId = '\0' + virtualModuleId

function listSvgFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)
    return entry.isDirectory() ? listSvgFiles(fullPath) : entry.name.endsWith('.svg') ? [fullPath] : []
  })
}

function createSymbol(file, iconDir) {
  const source = fs.readFileSync(file, 'utf8')
  const match = source.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i)
  if (!match) throw new Error(`Invalid SVG file: ${file}`)
  const relativeName = path.relative(iconDir, file).replace(/\\/g, '/').replace(/\.svg$/i, '').replace(/\//g, '-')
  const attributes = match[1]
    .replace(/\s(?:xmlns|width|height|class)=("[^"]*"|'[^']*')/gi, '')
    .trim()
  return `<symbol id="icon-${relativeName}" ${attributes}>${match[2]}</symbol>`
}

/** 构建项目内 SVG 雪碧图，替代依赖陈旧的 vite-plugin-svg-icons。 */
export default function createSvgIcon() {
  const iconDir = path.resolve(process.cwd(), 'src/assets/icons/svg')
  return {
    name: 'xy-svg-sprite',
    resolveId(id) {
      return id === virtualModuleId ? resolvedVirtualModuleId : null
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) return null
      const sprite = listSvgFiles(iconDir).map(file => createSymbol(file, iconDir)).join('')
      return `
        const sprite = ${JSON.stringify(sprite)}
        const mount = () => {
          if (document.getElementById('xy-svg-sprite')) return
          const container = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          container.id = 'xy-svg-sprite'
          container.setAttribute('aria-hidden', 'true')
          container.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
          container.innerHTML = sprite
          document.body.insertBefore(container, document.body.firstChild)
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true })
        else mount()
      `
    }
  }
}

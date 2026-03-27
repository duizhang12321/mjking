// 极简 Markdown 渲染为 HTML，仅处理标题、列表和引用
function mdToHtml(md) {
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const lines = (md || '').split(/\r?\n/)
  const html = lines.map(line => {
    if (/^###\s+/.test(line)) return `<h3>${esc(line.replace(/^###\s+/,''))}</h3>`
    if (/^##\s+/.test(line)) return `<h2>${esc(line.replace(/^##\s+/,''))}</h2>`
    if (/^#\s+/.test(line)) return `<h1>${esc(line.replace(/^#\s+/,''))}</h1>`
    if (/^>\s*/.test(line)) return `<blockquote>${esc(line.replace(/^>\s*/,''))}</blockquote>`
    if (/^-\s+/.test(line)) return `<li>${esc(line.replace(/^-[\s]*/,''))}</li>`
    if (line.trim()==='') return '<br />'
    return `<p>${esc(line)}</p>`
  }).join('\n')
  // 包装列表项到 ul（简单处理）
  const wrapped = html.replace(/(<li>[^<]*<\/li>\n?)+/g, m => `<ul>\n${m}\n</ul>`)
  return wrapped
}

module.exports = { mdToHtml }


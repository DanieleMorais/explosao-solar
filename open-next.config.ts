import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import incrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache'

// Cache incremental via Static Assets (sem R2/KV): as páginas pré-renderizadas
// (artigos SSG, home, editorias) são servidas direto dos assets do Worker.
// Páginas ISR (terremotos/cotações) re-renderizam sob demanda ao expirar.
export default defineCloudflareConfig({ incrementalCache })

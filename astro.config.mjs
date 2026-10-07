// @ts-check
import { defineConfig } from 'astro/config'

// A GitHub Pages user site is served from the domain root, so there is no base path.
// Project sites such as /filament live in their own repos; never add a page with the same path here.
export default defineConfig({
  site: 'https://vipinsudhakar.github.io',
  // Listen on the IPv4 loopback explicitly. Left as "localhost", Node on Windows can bind to IPv6
  // only ([::1]), and browsers that reach localhost through 127.0.0.1 then can't connect.
  server: { host: '127.0.0.1', port: 4321 },
  devToolbar: { enabled: false },
})

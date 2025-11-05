import { defineConfig } from 'astro/config';
import mcp from 'astro-mcp';
// https://astro.build/config
export default defineConfig({
  integrations: [mcp()]
});
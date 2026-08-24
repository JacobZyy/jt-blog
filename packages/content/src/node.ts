import { fileURLToPath } from 'node:url'

export const CONTENT_DATA_DIR = fileURLToPath(new URL('../data/', import.meta.url))

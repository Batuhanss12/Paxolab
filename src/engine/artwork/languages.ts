/**
 * languages — facade re-exporting the decomposed language/palette/type modules.
 * Palette data lives in paletteTable.ts.
 * Style profiles live in styleProfiles.ts.
 * Type faces live in typeFaces.ts.
 * This file preserves the public API.
 */
export type { LanguageId } from './paletteTable'
export type { StyleProfile } from './styleProfiles'
export type { TypeFaceRole } from './typeFaces'
export { languageId, paletteFor, varyPalette } from './paletteTable'
export { styleProfile, styleWeight } from './styleProfiles'
export { typeFaces, fontStack } from './typeFaces'

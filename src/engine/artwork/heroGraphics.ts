/**
 * heroGraphics.ts — facade for the modular hero library.
 * All hero rendering now lives in ./heroes/*. New heroes go there.
 */
export {
  heroPaintScale,
  heroYFrac,
  kitHeroFamily,
  paintBadge,
  paintBotanical,
  paintCrest,
  paintDrop,
  paintHarvest,
  paintHeroGraphic,
  paintMonstera,
  paintOval,
  paintPalm,
  paintSeal,
  paintTech,
  wrapHero,
} from './heroes'
export { heroAxisX, resolveHeroPlacement, measureHeroCollision } from './heroes/heroPlacement'

/**
 * FORMA-side Forxa registry — raw engines only, no 3 mm bleed wrapper.
 */
import type { PackagingStructure } from './types'
import { MailerBox } from './structures/mailerBox'
import { PillowBox } from './structures/pillowBox'
import { PolygonBox } from './structures/polygonBox'
import { ProductCarrierTray } from './structures/productCarrierTray'
import { ReverseTuckEndBox } from './structures/reverseTuckEndBox'
import { RigidGiftBox } from './structures/rigidGiftBox'
import { Sleeve } from './structures/sleeve'
import { SnapLockBox } from './structures/snapLockBox'
import { TrayBox } from './structures/trayBox'
import { RscCarton } from './structures/rscCarton'
import { TuckEndBox } from './structures/tuckEndBox'
import { TuckTopAutoBottom } from './structures/tuckTopAutoBottom'

const structures = new Map<string, PackagingStructure>()

function register(structure: PackagingStructure): void {
  structures.set(structure.id, structure)
}

register(new TuckEndBox())
register(new ReverseTuckEndBox())
register(new MailerBox())
register(new Sleeve())
register(new PillowBox())
register(new SnapLockBox())
register(new TrayBox())
register(new RigidGiftBox())
register(new PolygonBox())
register(new ProductCarrierTray())
register(new TuckTopAutoBottom())
register(new RscCarton())

export const registry = {
  get(id: string): PackagingStructure | undefined {
    return structures.get(id)
  },
  has(id: string): boolean {
    return structures.has(id)
  },
  listIds(): string[] {
    return Array.from(structures.keys())
  },
}

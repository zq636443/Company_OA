import {
  BriefcaseBusiness,
  ClipboardList,
  Landmark,
  PackageCheck,
  Scale,
  Stamp,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconByCategory: Record<string, LucideIcon> = {
  采购: PackageCheck,
  财务: Landmark,
  法务: Scale,
  行政: ClipboardList,
  人事: BriefcaseBusiness,
  技术: Wrench,
  用印: Stamp,
}

export function getTemplateIcon(category: string) {
  return iconByCategory[category] ?? ClipboardList
}

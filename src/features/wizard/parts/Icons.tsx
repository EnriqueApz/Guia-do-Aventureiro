import {
  Axe,
  BookOpen,
  Crosshair,
  Eye,
  Flame,
  Hand,
  KeyRound,
  Leaf,
  Music,
  ShieldPlus,
  Sun,
  Swords,
  type LucideIcon,
} from 'lucide-react';

const CLASS_ICONS: Record<string, LucideIcon> = {
  barbarian: Axe,
  bard: Music,
  cleric: Sun,
  druid: Leaf,
  fighter: Swords,
  monk: Hand,
  paladin: ShieldPlus,
  ranger: Crosshair,
  rogue: KeyRound,
  sorcerer: Flame,
  warlock: Eye,
  wizard: BookOpen,
};

export function ClassIcon({ id, className = 'size-5' }: { id: string; className?: string }) {
  const Icon = CLASS_ICONS[id] ?? Swords;
  return <Icon aria-hidden className={className} />;
}

/** Medalhão com a inicial, até as ilustrações das espécies chegarem (fase 8). */
export function Monogram({ name }: { name: string }) {
  return <span className="font-display text-lg leading-none font-semibold">{name.charAt(0)}</span>;
}

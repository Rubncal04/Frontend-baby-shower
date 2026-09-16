import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Baby,
  Backpack,
  Bath,
  BedDouble,
  Bird,
  Coffee,
  CupSoda,
  Fan,
  Gift,
  Lamp,
  Layers,
  Monitor,
  Moon,
  Puzzle,
  Shirt,
  Sparkles,
  Square,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  crib: Baby,
  "rocking-chair": Armchair,
  monitor: Monitor,
  "diaper-bag": Backpack,
  mattress: BedDouble,
  sterilizer: Sparkles,
  kettle: Coffee,
  toiletries: Bath,
  blanket: Layers,
  thermos: CupSoda,
  lamp: Lamp,
  fan: Fan,
  onesie: Shirt,
  rattle: Puzzle,
  "nursing-pillow": Moon,
  "rubber-duck": Bird,
  "changing-pad": Square,
};

/** Renders the pictogram that matches a gift icon key from the API. */
export function GiftIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Gift;
  return <Icon className={className ?? "size-5"} aria-hidden />;
}

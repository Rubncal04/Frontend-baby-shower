import { routing } from "./routing";
import type es from "../messages/es.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof es;
  }
}

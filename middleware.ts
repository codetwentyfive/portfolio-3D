import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip api routes, Next internals, and files with an extension (assets, SEO files)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

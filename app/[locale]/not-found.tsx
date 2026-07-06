import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";

export default function NotFound() {
  const t = useTranslations();

  return (
    <section className="max-container flex flex-col items-center justify-center text-center">
      <h1 className="head-text">404</h1>
      <p className="mt-5 text-slate-500">
        {t("not_found_text")}
      </p>
      <Link href="/" className="btn mt-10 !w-auto">
        {t("not_found_home")}
      </Link>
    </section>
  );
}

import { Compass } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-gradient-to-b from-background to-muted/50 border-t border-border">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">VirtueYatra</span>
          </div>
          <p className="text-muted-foreground">{t("footer.tagline")}</p>
        </div>
        <nav aria-label={t("footer.discover")}>
          <h3 className="font-semibold mb-4">{t("footer.discover")}</h3>
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <li><a className="hover:text-primary" href="#destinations">{t("footer.destinations")}</a></li>
            <li><a className="hover:text-primary" href="#experiences">{t("footer.experiences")}</a></li>
            <li><a className="hover:text-primary" href="#plan">{t("nav.plan")}</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
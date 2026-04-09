import { ShieldCheck } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">UPMRS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Unified Patient Medical Record System. Built for a healthier future.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

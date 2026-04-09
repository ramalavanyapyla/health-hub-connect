import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-lg">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            UPMRS
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">How it Works</a>
          <a href="#impact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Impact</a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button size="sm" className="gradient-primary border-0 text-primary-foreground shadow-soft" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-foreground">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border bg-background px-4 pb-4 md:hidden"
        >
          <div className="flex flex-col gap-3 pt-3">
            <a href="#features" className="text-sm text-muted-foreground" onClick={() => setIsOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground" onClick={() => setIsOpen(false)}>How it Works</a>
            <a href="#impact" className="text-sm text-muted-foreground" onClick={() => setIsOpen(false)}>Impact</a>
            <Button variant="ghost" size="sm" asChild><Link to="/login">Log in</Link></Button>
            <Button size="sm" className="gradient-primary border-0 text-primary-foreground" asChild><Link to="/register">Get Started</Link></Button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;

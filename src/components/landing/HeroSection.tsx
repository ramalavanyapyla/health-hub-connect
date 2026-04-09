import { motion } from "framer-motion";
import { ArrowRight, QrCode, Brain, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-medical.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden gradient-hero pt-32 pb-20 lg:pb-32">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-health-teal/5 blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-health-teal/30 bg-health-teal/10 px-4 py-1.5 mb-6">
              <ShieldCheck className="h-4 w-4 text-health-teal" />
              <span className="text-xs font-medium text-health-teal">Unified Patient Medical Record System</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-primary-foreground">One Patient.</span>
              <br />
              <span className="text-primary-foreground">One ID.</span>
              <br />
              <span className="text-gradient">Complete History.</span>
            </h1>

            <p className="text-lg text-primary-foreground/60 max-w-lg mb-8 font-body">
              A smart healthcare platform that gives every patient a unique identity to access, manage, and share their complete medical history securely across hospitals.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button size="lg" className="gradient-primary border-0 text-primary-foreground shadow-glow gap-2" asChild>
                <Link to="/register">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 gap-2">
                <QrCode className="h-4 w-4" /> Emergency Access
              </Button>
            </div>

            <div className="flex items-center gap-8">
              {[
                { icon: QrCode, label: "QR Quick Access" },
                { icon: Brain, label: "AI Report Simplifier" },
                { icon: ShieldCheck, label: "Role-Based Security" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  className="flex items-center gap-2"
                >
                  <item.icon className="h-4 w-4 text-health-teal" />
                  <span className="text-xs text-primary-foreground/50">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-glow animate-pulse-glow">
              <img src={heroImage} alt="UPMRS Healthcare Platform" className="w-full h-auto rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-health-navy/50 to-transparent" />
            </div>

            {/* Floating stat cards */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-6 top-1/4 rounded-xl bg-card p-4 shadow-card"
            >
              <p className="text-2xl font-display font-bold text-health-teal">10M+</p>
              <p className="text-xs text-muted-foreground">Records Secured</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 bottom-1/4 rounded-xl bg-card p-4 shadow-card"
            >
              <p className="text-2xl font-display font-bold text-health-blue">500+</p>
              <p className="text-xs text-muted-foreground">Hospitals Connected</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

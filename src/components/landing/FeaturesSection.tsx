import { motion } from "framer-motion";
import {
  Fingerprint,
  Brain,
  QrCode,
  ShieldCheck,
  Bell,
  Activity,
  Cloud,
  Building2,
  Globe,
  Code2,
} from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    title: "Unified Patient ID",
    description: "Single ID for lifetime medical records across all hospitals — no duplication, no confusion.",
    color: "text-health-teal",
    bg: "bg-health-teal/10",
  },
  {
    icon: Brain,
    title: "AI Report Simplifier",
    description: "Converts complex medical reports into simple, easy-to-understand language for patients.",
    color: "text-health-blue",
    bg: "bg-health-blue/10",
  },
  {
    icon: QrCode,
    title: "Emergency Quick Access",
    description: "Access patient data instantly using QR code — a life-saving feature in critical situations.",
    color: "text-health-green",
    bg: "bg-health-green/10",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    description: "Different access levels for doctors, admins, and patients ensuring data privacy and security.",
    color: "text-health-teal",
    bg: "bg-health-teal/10",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    description: "Patients get instant alerts when new reports are uploaded or diagnosis is updated.",
    color: "text-health-blue",
    bg: "bg-health-blue/10",
  },
  {
    icon: Activity,
    title: "Smart Medical Timeline",
    description: "Visual timeline of patient history — easy tracking of diseases, treatments, and reports.",
    color: "text-health-green",
    bg: "bg-health-green/10",
  },
  {
    icon: Cloud,
    title: "Cloud-Based Storage",
    description: "Secure storage of reports, PDFs, scans, and images — accessible from anywhere, anytime.",
    color: "text-health-teal",
    bg: "bg-health-teal/10",
  },
  {
    icon: Building2,
    title: "Multi-Hospital Integration",
    description: "Multiple hospitals can access and update records using the same patient ID.",
    color: "text-health-blue",
    bg: "bg-health-blue/10",
  },
  {
    icon: Globe,
    title: "Scalable Nationwide",
    description: "Can be expanded into a nationwide digital health system for future healthcare digitization.",
    color: "text-health-green",
    bg: "bg-health-green/10",
  },
  {
    icon: Code2,
    title: "Developer-Friendly",
    description: "Clean full-stack architecture, easy to extend with AI, blockchain, and mobile apps.",
    color: "text-health-teal",
    bg: "bg-health-teal/10",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-health-teal uppercase tracking-wider">Features</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 text-foreground">
            Built to <span className="text-gradient">Beat the Competition</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            10 unique features designed to transform healthcare data management
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group gradient-card rounded-xl border border-border/50 p-5 transition-all hover:shadow-card hover:border-primary/30"
            >
              <div className={`${feature.bg} w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="font-display font-semibold text-sm text-foreground mb-2">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

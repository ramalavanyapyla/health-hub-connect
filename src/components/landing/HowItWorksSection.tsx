import { motion } from "framer-motion";
import { UserPlus, Upload, Search, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Register & Get Unique ID",
    description: "Patient registers on the platform and receives a unique lifetime medical ID.",
  },
  {
    icon: Upload,
    step: "02",
    title: "Hospital Uploads Records",
    description: "Doctors and hospitals upload diagnoses, prescriptions, and reports linked to the patient ID.",
  },
  {
    icon: Search,
    step: "03",
    title: "Access Anytime, Anywhere",
    description: "Patients can view their complete medical history from any device, securely.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Share Securely",
    description: "Share records with new doctors or hospitals using QR code or unique ID — instant access.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-health-teal uppercase tracking-wider">How it Works</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 text-foreground">
            Simple. Secure. <span className="text-gradient">Seamless.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px border-t-2 border-dashed border-border" />
              )}
              <div className="gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-soft">
                <step.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="text-xs font-bold text-health-teal mb-2 block">STEP {step.step}</span>
              <h3 className="font-display font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

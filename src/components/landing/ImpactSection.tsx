import { motion } from "framer-motion";

const stats = [
  { value: "80%", label: "Faster Record Access" },
  { value: "Zero", label: "Lost Physical Reports" },
  { value: "100%", label: "Patient Data Control" },
  { value: "24/7", label: "Anywhere Access" },
];

const ImpactSection = () => {
  return (
    <section id="impact" className="py-24 gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-health-teal/5" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-health-teal uppercase tracking-wider">Impact</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 text-primary-foreground">
            Transforming Healthcare <span className="text-gradient">Data Management</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display text-4xl md:text-5xl font-bold text-gradient mb-2">{stat.value}</p>
              <p className="text-sm text-primary-foreground/60">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;

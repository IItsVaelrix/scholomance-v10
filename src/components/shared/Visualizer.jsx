import { motion } from "framer-motion";
import { getStateClass } from "../../js/stateClasses.js";

export default function Visualizer({ school, active }) {
  if (!active) return null;
  const schoolClass = getStateClass("school", school);

  return (
    <div className={`visualizer ${schoolClass}`}>
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={i}
          className="visualizer-bar"
          animate={{ height: [10, 60, 24, 70, 18] }}
          transition={{
            duration: 0.55,
            repeat: Infinity,
            repeatType: "mirror",
            delay: i * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

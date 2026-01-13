import { SCHOOLS, generateSchoolColor } from "../../data/schools";

/**
 * Generate CSS variables for all schools
 * This allows dynamic school addition without CSS changes
 * @returns {string} CSS variable block
 */
export function generateSchoolCSSVariables() {
  const lines = [':root {'];
  
  // Generate color variables
  Object.entries(SCHOOLS).forEach(([id, school]) => {
    const color = generateSchoolColor(id);
    const colorLower = id.toLowerCase();
    
    lines.push(`  --school-${colorLower}: ${color};`);
    lines.push(`  --school-${colorLower}-hsl: ${school.colorHsl.h}, ${school.colorHsl.s}%, ${school.colorHsl.l}%;`);
    lines.push(`  --school-${colorLower}-glow: hsla(${school.colorHsl.h}, ${school.colorHsl.s}%, ${school.colorHsl.l}%, 0.4);`);
  });
  
  // Generate angle variables
  Object.entries(SCHOOLS).forEach(([id, school]) => {
    lines.push(`  --school-${id.toLowerCase()}-angle: ${school.angle}deg;`);
  });
  
  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate locked state styles
 * @returns {string} CSS for locked schools
 */
export function generateLockedSchoolStyles() {
  return `
.school--locked {
  opacity: 0.4;
  filter: grayscale(0.8);
  cursor: not-allowed;
  position: relative;
}

.school--locked::after {
  content: "🔒";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
}

.school--locked:hover {
  opacity: 0.6;
}

.school-progress-ring {
  transition: stroke-dashoffset 0.3s ease;
}

/* Unlock animation */
@keyframes unlock-flash {
  0% { background-color: rgba(255, 255, 255, 0); }
  50% { background-color: rgba(255, 255, 255, 0.3); }
  100% { background-color: rgba(255, 255, 255, 0); }
}

.school-unlocked {
  animation: unlock-flash 0.8s ease-out;
}
`;
}

/**
 * Inject dynamic styles into document
 */
export function injectDynamicStyles() {
  const styleId = 'school-dynamic-styles';
  
  // Remove existing if any
  const existing = document.getElementById(styleId);
  if (existing) existing.remove();
  
  // Create and inject new styles
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = generateSchoolCSSVariables() + generateLockedSchoolStyles();
  document.head.appendChild(style);
}

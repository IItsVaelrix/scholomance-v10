import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LINKS } from "../../data/library";
import "./Navigation.css";

export default function Navigation() {
  const location = useLocation();
  const activeSection = location.pathname.replace("/", "") || "watch";

  return (
    <nav className="nav surface" data-surface="nav">
      <div className="container navInner">
        <NavLink to="/watch" className="navBrand" aria-label="Go to Watch">
          <span className="sigil" aria-hidden="true" />
          SCHOLOMANCE
        </NavLink>

        <div className="navLinks" role="navigation" aria-label="Primary">
          {LINKS.map((l) => (
            <div key={l.id} className="navItem">
              <NavLink
                to={l.path}
                className={({ isActive }) =>
                  `navLink ${isActive ? "navLinkActive" : ""}`
                }
              >
                {l.label}
              </NavLink>
              {activeSection === l.id && (
                <motion.div
                  layoutId="nav-highlight"
                  className="navPill"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

import { NavLink } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const Navbar = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="header flex justify-between items-center p-4 z-50">
      <NavLink
        to="/"
        className="w-10 h-10 rounded-lg bg-white items-center justify-center flex font-bold shadow-md"
      >
        <p className="gradient_text">Chi</p>
      </NavLink>
      <button
        className="md:hidden bg-white p-2 rounded-lg w-10 h-10 z-50 flex items-center justify-center"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span className="gradient_text font-bold">
          {isMenuOpen ? '✕' : '☰'}
        </span>
      </button>
      <nav className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row text-lg gap-4 md:gap-7 font-medium absolute md:relative top-16 md:top-0 right-4 md:right-0 bg-white md:bg-transparent p-4 md:p-0 rounded-lg shadow-md md:shadow-none z-50`}>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? "gradient_text font-bold" : "text-black"
          }
          onClick={() => setIsMenuOpen(false)}
        >
          {t('about')}
        </NavLink>
        <NavLink
          to="/Projects"
          className={({ isActive }) =>
            isActive ? "gradient_text font-bold" : "text-black"
          }
          onClick={() => setIsMenuOpen(false)}
        >
          {t('projects')}
        </NavLink>
        <NavLink
          to="/Contact"
          className={({ isActive }) =>
            isActive ? "gradient_text font-bold" : "text-black"
          }
          onClick={() => setIsMenuOpen(false)}
        >
          {t('contact')}
        </NavLink>
        <LanguageSwitcher/>
      </nav>
    </header>
  );
};

export default Navbar;

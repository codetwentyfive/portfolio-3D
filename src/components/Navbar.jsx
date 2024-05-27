import { NavLink } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { t } = useTranslation();

  return (
    <header className="header">
      <NavLink
        to="/"
        className="w-10 h-10 rounded-lg bg-white items-center justify-center flex font-bold shadow-md"
      >
        <p className="gradient_text">Chi</p>
      </NavLink>
      <nav className="flex text-lg gap-7 font-medium">
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? "gradient_text font-bold" : "text-black"
          }
        >
        {t('about')}
        </NavLink>
        <NavLink
          to="/Projects"
          className={({ isActive }) =>
            isActive ? "gradient_text font-bold" : "text-black"
          }
        >
        {t('projects')}
          
        </NavLink>
        <LanguageSwitcher/>
      </nav>
    </header>
  );
};

export default Navbar;

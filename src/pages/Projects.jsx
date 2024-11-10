import { arrow, github } from "../assets/icons";
import { projects } from "../constants/index";
import { Link } from "react-router-dom";
import CTA from "../components/CTA";
import { useTranslation } from "react-i18next";

const Projects = () => {
  const { t, i18n } = useTranslation();

  // Function to get project description based on language
  const getProjectDescription = (project) => {
    const lang = i18n.language; // Get current language
    return project.descriptions[lang] || project.descriptions["en"]; // Fallback to English if translation not available for the selected language
  };

  // Function to get project name based on language
  const getProjectName = (project) => {
    const lang = i18n.language;
    return typeof project.name === 'object' 
      ? (project.name[lang] || project.name["en"])
      : project.name;
  };

  return (
    <section className="max-container">
      <h1 className="head-text">
        {t("project_header1")}{" "}
        <span className="gradient_text font-semibold drop-shadow">
          {t("project_header2")}
        </span>
      </h1>

      <div className="mt-5 flex flex-col gap-3 text-slate-500">
        <p>
          {t("projects_text1")} <br />
          {t("projects_text2")} <br />
          {t("projects_text3")} <br />
          {t("projects_text4")}
        </p>
      </div>
      <div className="flex flex-wrap my-20 gap-16">
        {projects.map((project) => (
          <div className="lg:w-[400px] w-full" key={getProjectName(project)}>
            <div className="block-container w-12 h-12">
              <div className={`btn-back rounded-xl ${project.theme}`} />
              <div className="btn-front rounded-xl flex justify-center items-center">
                <img
                  src={project.iconUrl}
                  alt="Project Icon"
                  className="w-1/2 h-1/2 object-contain"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-col">
              <h4 className="text-2xl font-poppins font-semibold">
                {getProjectName(project)}
              </h4>
              <p className="mt-2 text-slate-500">
                {getProjectDescription(project)}
              </p>
              <div className="flex flex-row justify-between">
                <div className="mt-5 flex items-center gap-2 font-poppins">
                  <Link
                    to={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600"
                  >
                    Live Link
                  </Link>

                  <img
                    src={arrow}
                    alt="arrow"
                    className="w-4 h-4 object-contain"
                  />
                </div>
                <div className="mt-5 flex items-center gap-2 font-poppins">
                  <Link
                    to={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600"
                  >
                    Github
                  </Link>

                  <img
                    src={github}
                    alt="arrow"
                    className="w-4 h-4 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <hr className="border-slate-200" />
      <CTA />
    </section>
  );
};

export default Projects;

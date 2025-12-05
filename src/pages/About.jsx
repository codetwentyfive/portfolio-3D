import { skills, experiences } from "../constants";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import CTA from "../components/CTA";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t, i18n } = useTranslation();

  const translateText = (textObject) => {
    const lang = i18n.language; 
    return textObject[lang] || textObject["en"]; // Fallback to English if translation not available for the selected language
  };

  return (
    <section className="max-container">
      <h1 className="head-text">
        {t("greeting_about")}{" "}
        <span className="gradient_text font-semibold drop-shadow">Chingis</span>
      </h1>

      <div className="mt-5 flex flex-col gap-3 text-slate-500">
        <p>{t("short_intro")}</p>
      </div>

      <div className="py-10 flex flex-col">
        <h3 className="subhead-text">{t("my_skills")}</h3>

        <div className="mt-16 flex flex-wrap gap-12 justify-center items-center">
          {skills.map((skill) => (
            <div className="group relative block-container w-20 h-20" key={skill.name}>
              <div className="btn-back rounded-xl" />
              <div className="btn-front rounded-xl flex justify-center items-center">
                <img
                  src={skill.imageUrl}
                  alt={skill.name}
                  className="w-1/2 h-1/2 object-contain"
                />
              </div>
              {/* Tooltip */}
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 
                             bg-black/80 text-white px-2 py-1 rounded-md text-sm
                             opacity-0 group-hover:opacity-100 transition-opacity duration-300
                             whitespace-nowrap pointer-events-none">
                {skill.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="py-16">
        <div className="flex flex-col gap-3 text-slate-500">
          <p>{t("timeline_description1")}</p>
          <p>{t("timeline_description2")}</p>
          <p>{t("timeline_description3")}</p>
        </div>
        <h3 className="mt-12 subhead-text">{t("timeline")}</h3>

        <div className="flex">
          <VerticalTimeline>
            {experiences.map((experience, index) => (
              <VerticalTimelineElement
                key={`${experience.title}_${index}`}
                date={translateText(experience.date)}
                iconStyle={{ background: "white" }}
                icon={
                  <div className="flex justify-center items-center w-full h-full">
                    <img
                      src={experience.icon}
                      alt={translateText(experience.company_name)}
                      className="w-[60%] h-[60%] object-contain"
                    />
                  </div>
                }
                contentStyle={{
                  borderBottom: "8px",
                  borderStyle: "solid",
                  borderBottomColor: experience.iconBg,
                  boxShadow: "none",
                  borderRadius: "30px",
                }}
              >
                <div>
                  <h3 className="text-black text-xl font-poppins font-semibold">
                    {translateText(experience.title)}
                  </h3>
                  <p
                    className="text-black-500 font-medium text-base"
                    style={{ margin: 0 }}
                  >
                    {translateText(experience.company_name)}
                  </p>
                </div>

                <ul className="my-5 list-disc ml-5 space-y-2">
                  {experience.points.map((point, index) => (
                    <li
                      key={`experience-point-${index}`}
                      className="text-black-500/50 font-normal pl-1 text-sm"
                    >
                      {translateText(point)}
                    </li>
                  ))}
                </ul>
              </VerticalTimelineElement>
            ))}
          </VerticalTimeline>
        </div>
      </div>

      <hr className="border-slate-200" />

      <CTA />
    </section>
  );
};

export default About;

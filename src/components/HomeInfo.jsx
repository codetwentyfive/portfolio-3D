import { Link } from "react-router-dom";
import { arrow } from "../assets/icons";
const InfoBox = ({ text, link, btnText }) => (
  <div className="info-box">
    <p className="font-medium sm:text-xl text-center">{text}</p>
    <Link to={link} className="neo-brutalism-white neo-btn">
      {btnText}
      <img src={arrow} className="w-4 h-4 object-contain" />
    </Link>
  </div>
);

const renderContent = {
  1: (
    <h1 className="sm:text-xl sm:leading-snug text-center neo-brutalism-blue py-4 px-8 text-white mx-5">
      Hi, I'm <span className="font-semibold">Chingis Enkhbaatar</span> 👋
      <br />
      A Full Stack Developer located in <br />
      Karlsruhe, Germany.
    </h1>
  ),
  2: (
    <InfoBox
      text={
        <>A digital nomad in the truest sense 🐎, <br /> who loves all things creative 🎨</>
      }
      link="/about"
      btnText="Learn More"
    />
  ),
  3: (
    <InfoBox
      text={
        <>
          I've worked on many projects and picked up many skills along the way
          <br />
          My motto is to be +1% better everyday 📚
        </>
      }
      link="/projects"
      btnText="Visit my portfolio"
    />
  ),
  4: (
    <InfoBox
      text={
        <>
          Let's build together!
          <br />
          I'm just a few keystrokes away! 🚀
        </>
      }
      link="/contact"
      btnText="Let's talk"
    />
  ),
};

const HomeInfo = ({ currentStage }) => {
  return renderContent[currentStage] || null;
};

export default HomeInfo;

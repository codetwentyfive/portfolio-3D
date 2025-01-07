import { Suspense, useRef, useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { Canvas } from "@react-three/fiber";
import Fox from "../models/Fox";
import Loader from "../components/Loader";
import useAlert from "../hooks/useAlert";
import Alert from "../components/Alert";
import { cvdownload } from "../assets/icons";
import { useTranslation } from 'react-i18next';

const Contact = () => {
  const formRef = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState("idle");

  const [showModal, setShowModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const { t } = useTranslation();

  const { alert, showAlert, hideAlert } = useAlert();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setCurrentAnimation("hit");

    emailjs
      .send(
        import.meta.env.VITE_APP_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          to_name: "Chingis",
          from_email: form.email,
          to_email: "chingisenkhbaatar@gmail.com",
          message: `Email: ${form.email}\n\nMessage: ${form.message}`,
        },
        import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY
      )
      .then(() => {
        setIsLoading(false);
        showAlert({
          show: true,
          text: t('contact_success_message'),
          type: "success",
        });
        setForm({ name: "", email: "", message: "" });

        setTimeout(() => {
          hideAlert();
          setCurrentAnimation("idle");
          setForm({ name: "", email: "", message: "" });
        }, [3000]);
      })
      .catch((error) => {
        setIsLoading(false);
        setCurrentAnimation("idle");
        console.log(error);
        showAlert({
          show: true,
          text: t('contact_error_message'),
          type: "danger",
        });
      });
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleFocus = () => {
    setCurrentAnimation("walk");
  };

  const handleBlur = () => {
    setCurrentAnimation("idle");
  };

  const handleDownloadClick = () => {
    setShowModal(true);
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".modal-content") && showModal) {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal]);

  const handleDownload = () => {
    if (selectedLanguage === "german") {
      window.open("/Chingis Zwecker-CV_German.pdf", "_blank");
    } else if (selectedLanguage === "english") {
      window.open("/Chingis Zwecker-CV_English.pdf", "_blank");
    }
    closeModal();
  };

  const adjustFoxForScreenSize = () => {
    let screenScale, screenPosition;
    
    if (window.innerWidth < 768) {
      screenScale = [0.4, 0.4, 0.4];
      screenPosition = [0.5, 0.5, 0];
    } else if (window.innerWidth < 1024) {
      screenScale = [0.5, 0.5, 0.5];
      screenPosition = [0.5, 0.35, 0];
    } else {
      screenScale = [0.6, 0.6, 0.6];
      screenPosition = [0.5, 0.2, 0];
    }
    
    return [screenScale, screenPosition];
  };

  const [foxScale, foxPosition] = adjustFoxForScreenSize();

  return (
    <section className="relative flex lg:flex-row flex-col max-container min-h-screen">
      {alert.show && <Alert {...alert} />}

      <div className="flex-1 min-w-[50%] flex flex-col">
        <div className="flex flex-col justify-center items-center">
          <h1 className="head-text ">
            {t('contact_heading')}
            <span className="gradient_text">{t('contact_heading_span')}</span>
          </h1>
        </div>
      
        <form
          className="w-full flex flex-col gap-7 mt-14 "
          onSubmit={handleSubmit}
        >
          <label className="text-black-500 font-semibold">
            {t('contact_name_label')}
            <input
              type="text"
              name="name"
              className="input"
              placeholder={t('contact_name_placeholder')}
              required
              value={form.name}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
          <label className="text-black-500 font-semibold">
            {t('contact_email_label')}
            <input
              type="email"
              name="email"
              className="input"
              placeholder={t('contact_email_placeholder')}
              required
              value={form.email}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
          <label className="text-black-500 font-semibold">
            {t('contact_message_label')}
            <textarea
              name="message"
              rows="4"
              className="textarea"
              placeholder={t('contact_message_placeholder')}
              value={form.message}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
          <button
            type="submit"
            className="btn"
            disabled={isLoading}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            {isLoading ? t('contact_sending') : t('contact_send_button')}
          </button>
        </form>
        <div className="mt-4 px-2 btn flex flex-row  hover:cursor-pointer justify-center items-center"
          onClick={handleDownloadClick}>
            <p className=" ">{t('contact_download_button')}</p>
            {/* <div className=" ">
              <img
                src={cvdownload}
                className="h-8 text-cyan-50"
                onClick={handleDownloadClick}
                alt="Download CV"
              />
            </div> */}
          </div>
      </div>
      <div className="lg:w-1/2 w-full lg:h-[640px] md:h-[550px] h-[350px]">
        <Canvas
          camera={{ 
            position: [0, 0, 5],
            fov: 75, 
            near: 0.1, 
            far: 1000
          }}
          className="w-full h-full"
        >
          <directionalLight intensity={2.5} position={[0, 0, 1]} />
          <ambientLight intensity={0.2} />
          <Suspense fallback={<Loader />}>
            <Fox
              currentAnimation={currentAnimation}
              position={foxPosition}
              rotation={[12.6, -0.6, 0]}
              scale={foxScale}
            />
          </Suspense>
        </Canvas>
      </div>

      {showModal && (
        <div className="modal ">
          <div className="modal-content info-box">
            <h2 className="font-medium sm:text-xl text-center">
              {t('contact_select_language')}
            </h2>
            <button
              onClick={() => handleLanguageSelect("german")}
              className={selectedLanguage === "german" ? "selected" : ""}
            >
              - {t('contact_german')} 🇩🇪
            </button>
            <button
              onClick={() => handleLanguageSelect("english")}
              className={selectedLanguage === "english" ? "selected" : ""}
            >
              - {t('contact_english')} 🇬🇧
            </button>
            <button
              className="border-dotted border-black bg-white neo-btn"
              onClick={handleDownload}
            >
              {t('contact_confirm')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Contact;

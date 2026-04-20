import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Fox from "../models/Fox";
import Loader from "../components/Loader";
import useAlert from "../hooks/useAlert";
import Alert from "../components/Alert";
import SEO from "../components/SEO";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

const EMPTY_FORM = { name: "", email: "", message: "", company: "" };
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 2000;
const SUBMIT_COOLDOWN_MS = 30000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_API_ENDPOINT = import.meta.env.VITE_APP_CONTACT_API_URL || "/api/contact";

const Contact = () => {
  const lastSubmittedAtRef = useRef(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState("idle");

  const { t } = useTranslation();

  const { alert, showAlert, hideAlert } = useAlert();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getValidationError = (nextForm) => {
    const now = Date.now();

    if (now - lastSubmittedAtRef.current < SUBMIT_COOLDOWN_MS) {
      return "rate_limit";
    }

    if (nextForm.company) {
      return "validation";
    }

    if (
      nextForm.name.length < 2 ||
      nextForm.name.length > NAME_MAX_LENGTH ||
      !EMAIL_REGEX.test(nextForm.email) ||
      nextForm.email.length > EMAIL_MAX_LENGTH ||
      nextForm.message.length < MESSAGE_MIN_LENGTH ||
      nextForm.message.length > MESSAGE_MAX_LENGTH
    ) {
      return "validation";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sanitizedForm = {
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      company: form.company.trim(),
    };
    const validationError = getValidationError(sanitizedForm);

    if (validationError) {
      showAlert({
        show: true,
        text:
          validationError === "rate_limit"
            ? t("contact_rate_limit_error")
            : t("contact_validation_error"),
        type: "danger",
      });
      setCurrentAnimation("idle");
      return;
    }

    setForm(sanitizedForm);
    setIsLoading(true);
    setCurrentAnimation("hit");
    lastSubmittedAtRef.current = Date.now();

    try {
      const response = await fetch(CONTACT_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedForm),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const errorMessage =
          response.status === 429
            ? t("contact_rate_limit_error")
            : response.status === 400
              ? t("contact_validation_error")
              : errorPayload?.error || t("contact_error_message");
        throw new Error(errorMessage);
      }

      setIsLoading(false);
      showAlert({
        show: true,
        text: t('contact_success_message'),
        type: "success",
      });
      setForm(EMPTY_FORM);

      setTimeout(() => {
        hideAlert();
        setCurrentAnimation("idle");
        setForm(EMPTY_FORM);
      }, 3000);
    } catch (error) {
      setIsLoading(false);
      setCurrentAnimation("idle");
      showAlert({
        show: true,
        text: error?.message || t('contact_error_message'),
        type: "danger",
      });
    }
  };

  const handleFocus = () => {
    setCurrentAnimation("walk");
  };

  const handleBlur = () => {
    setCurrentAnimation("idle");
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
      <SEO page="contact" />
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
          <div
            className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
            aria-hidden="true"
          >
            <label htmlFor="company">Company</label>
            <input
              id="company"
              type="text"
              name="company"
              autoComplete="organization"
              tabIndex={-1}
              value={form.company}
              onChange={handleChange}
            />
          </div>
          <label className="text-black-500 font-semibold">
            {t('contact_name_label')}
            <input
              type="text"
              name="name"
              className="input"
              placeholder={t('contact_name_placeholder')}
              required
              autoComplete="name"
              maxLength={NAME_MAX_LENGTH}
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
              autoComplete="email"
              maxLength={EMAIL_MAX_LENGTH}
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
              required
              minLength={MESSAGE_MIN_LENGTH}
              maxLength={MESSAGE_MAX_LENGTH}
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
          <p className="text-sm leading-6 text-slate-500">
            {t('contact_privacy_notice')}{" "}
            <Link
              className="text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
              to="/rechtliches#datenschutz"
            >
              {t('contact_privacy_link_text')}
            </Link>
            {t('contact_privacy_suffix')}
          </p>
        </form>
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

    </section>
  );
};

export default Contact;

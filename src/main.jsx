import ReactDOM from "react-dom/client";
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import App from "./App";
import "./index.css";
import i18n from './i18n';

ReactDOM.createRoot(document.getElementById("root")).render(
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <App />
        <Analytics />
      </I18nextProvider>
    </HelmetProvider>
);

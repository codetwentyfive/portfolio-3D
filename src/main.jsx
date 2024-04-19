import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import App from "./App";
import "./index.css";
import i18n from './i18n'; // Import i18n instance

ReactDOM.createRoot(document.getElementById("root")).render(
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
);

import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home, About, Projects, Contact, Legal } from "./pages";
import Navbar from "./components/Navbar";
import { AudioProvider } from "./context/AudioContext";
import AudioPlayer from "./components/AudioPlayer";
import SiteFooter from "./components/SiteFooter";

const App = () => {
  return (
    <AudioProvider>
      <main className="min-h-screen">
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/rechtliches" element={<Legal />} />
            <Route
              path="/impressum"
              element={
                <Navigate
                  replace
                  to={{ pathname: "/rechtliches", hash: "#impressum" }}
                />
              }
            />
            <Route
              path="/datenschutz"
              element={
                <Navigate
                  replace
                  to={{ pathname: "/rechtliches", hash: "#datenschutz" }}
                />
              }
            />
          </Routes>
          <AudioPlayer />
          <SiteFooter />
        </Router>
      </main>
    </AudioProvider>
  );
};

export default App;

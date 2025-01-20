import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home, About, Projects, Contact } from "./pages";
import Navbar from "./components/Navbar";
import { AudioProvider } from "./context/AudioContext";
import AudioPlayer from "./components/AudioPlayer";

const App = () => {
  return (
    <AudioProvider>
      <main className="bg-slate-300/20 h-full">
        <Router>
          <Navbar />
          <AudioPlayer />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Router>
      </main>
    </AudioProvider>
  );
};

export default App;

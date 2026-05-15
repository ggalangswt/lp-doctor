// Top-level router. /deck mirrors the submission PDF as a webpage.
import { Route, Routes } from "react-router-dom";
import { Atlas } from "./pages/Atlas.js";
import { Diagnose } from "./pages/Diagnose.js";
import { Landing } from "./pages/Landing.js";
import { Report } from "./pages/Report.js";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/atlas" element={<Atlas />} />
      <Route path="/diagnose/:tokenId" element={<Diagnose />} />
      <Route path="/report/:rootHash" element={<Report />} />
    </Routes>
  );
}

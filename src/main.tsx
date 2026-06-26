import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BopomofoTrainer from "./BopomofoTrainer.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BopomofoTrainer />
  </StrictMode>,
);

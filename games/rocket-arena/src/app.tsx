/**
 * Role routing.
 *
 * Air Jam hosts the projector surface at the base path and the phone surface at
 * `controllerPath` (`/controller`, declared in `airjam.config.ts`). Both are the
 * SAME deployed app — that is what makes "the players' phones are the
 * controllers" a single URL the projector can show as a QR code.
 */
import { Route, Routes } from "react-router-dom";
import { airjam } from "./airjam.config";
import { HostSurface } from "./host";
import { ControllerSurface } from "./host/controller-view";

export const App = () => (
  <Routes>
    <Route
      path="/"
      element={
        <airjam.Host>
          <HostSurface />
        </airjam.Host>
      }
    />
    <Route
      path={airjam.paths.controller}
      element={
        <airjam.Controller>
          <ControllerSurface />
        </airjam.Controller>
      }
    />
  </Routes>
);

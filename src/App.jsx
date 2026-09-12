import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Quests from "./pages/Quests";
import Character from "./pages/Character";
import Rewards from "./pages/Rewards";
import Profile from "./pages/Profile";
import QuestHistory from "./pages/QuestHistory";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Public Routes */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        {/* Protected Routes */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/quests"
            element={<Quests />}
          />

          <Route
            path="/history"
            element={<QuestHistory />}
          />

          <Route
            path="/character"
            element={<Character />}
          />

          <Route
            path="/rewards"
            element={<Rewards />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

        </Route>

        {/* Unknown Route */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
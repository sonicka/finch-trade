import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Lists from "./pages/Lists";
import Trades from "./pages/Trades";
import NotFound from "./pages/404";
import ProtectedRoute from "./components/ProtectedRoute";
import { Providers } from "./providers/Providers";
import BottomButton from "./components/BottomButton";

const App = () => {
  return (
    <Router>
      <Providers>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Lists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trades"
            element={
              <ProtectedRoute>
                <Trades />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomButton />
      </Providers>
    </Router>
  );
};

export default App;

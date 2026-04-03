import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Lists from './pages/Lists';
import Trades from './pages/Trades';
import Profile from './pages/Profile';
import Login from './pages/Login';
import NotFound from './pages/404';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { Providers } from './providers/Providers';

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
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Providers>
    </Router>
  );
};

export default App;

import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-beige">
      <h1 className="text-3xl font-bold mb-1">404</h1>
      <h1 className="text-xl font-semibold mb-6">Page Not Found</h1>
      <Button label="Go home" onClick={() => navigate('/')} />
    </div>
  );
};

export default NotFound;

import { useLocation, useNavigate } from 'react-router-dom';
import Card from './Card';
import Button from './Button';

const BottomButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const buttonText = (() => {
    switch (location.pathname) {
      case '/':
        return "Let's trade!";
      case '/trades':
        return 'Back to my lists';
      case '/profile':
        return 'Back to trading';
      default:
        return '';
    }
  })();

  const buttonFn = () => {
    switch (location.pathname) {
      case '/':
        return navigate('/trades');
      case '/trades':
        return navigate('/');
      case '/profile':
        return navigate('/');
      default:
        return navigate('/');
    }
  };

  if (
    location.pathname === '/' ||
    location.pathname === '/trades' ||
    location.pathname === '/profile'
  ) {
    return (
      <div className="mx-2 mb-2">
        <Card>
          <Button label={buttonText} onClick={buttonFn} />
        </Card>
      </div>
    );
  }

  return null;
};

export default BottomButton;

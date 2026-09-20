import { FC } from 'react';
import Alert from './Alert';

const DemoNotice: FC = () => {
  if (import.meta.env.VITE_DEMO_MODE !== 'true') return null;

  return (
    <Alert
      type="success"
      autoHide={false}
      message="Finch Trade preview: You are exploring a demo with sample data. No database is connected, so your changes are saved only in this browser and are not shared with other visitors."
    />
  );
};

export default DemoNotice;

import { ReactNode, useState } from 'react';
import Button from './Button';

interface Tab {
  label: string;
  content: ReactNode;
}
interface Tabs {
  tabs: Tab[];
}

const Tabs = ({ tabs }: Tabs) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const width = `w-1/${tabs.length}`;

  return (
    <div className="w-full flex flex-col justify-center">
      <div className="flex flex-row py-1 bg-mediumBeige rounded-b-lg">
        {tabs.map((tab, index) => (
          <Button
            key={tab.label}
            label={tab.label}
            className={`py-2 px-4 my-2 mx-6 ${width} text-center rounded-lg border-b-2 border-darkBeige ${
              activeTab === index
                ? 'bg-lightBeige text-darkBeige'
                : 'border-transparent text-lightBeige'
            }`}
            onClick={() => setActiveTab(index)}
          />
        ))}
      </div>
      <div className="p-4">{tabs[activeTab].content}</div>
    </div>
  );
};

export default Tabs;

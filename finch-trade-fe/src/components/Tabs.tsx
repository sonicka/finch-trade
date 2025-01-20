import { JSX, useState } from "react";

interface Tab {
  label: string;
  content: JSX.Element;
}
interface Tabs {
  tabs: Tab[];
}

const Tabs = ({ tabs }: Tabs) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const width = `w-1/${tabs.length}`;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex border-b">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            className={`py-2 px-4 ${width} text-center border-b-2 ${
              activeTab === index
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">{tabs[activeTab].content}</div>
    </div>
  );
};

export default Tabs;

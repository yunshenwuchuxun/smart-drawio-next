import { CHAT_TABS } from '@/lib/chat-panel-utils';

export default function ChatTabBar({ activeTab, onChange }) {
  return (
    <div className="flex border-b border-gray-200 bg-gray-50">
      {CHAT_TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
              isActive
                ? 'bg-white text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-pressed={isActive}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
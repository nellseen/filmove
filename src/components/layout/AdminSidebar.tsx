import React from 'react';
import { LayoutDashboard, FileText, PlusCircle, Layers } from 'lucide-react';

export type AdminTab = 'overview' | 'posts' | 'add-link' | 'bulk-import';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  counts?: {
    total: number;
    drafts: number;
  };
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  counts,
}) => {
  const navItems = [
    {
      id: 'overview' as AdminTab,
      label: 'Ringkasan',
      icon: LayoutDashboard,
    },
    {
      id: 'posts' as AdminTab,
      label: 'Kelola Postingan',
      icon: FileText,
      badge: counts?.total,
    },
    {
      id: 'add-link' as AdminTab,
      label: 'Tambah Link Telegram',
      icon: PlusCircle,
    },
    {
      id: 'bulk-import' as AdminTab,
      label: 'Impor Massal',
      icon: Layers,
    },
  ];

  return (
    <aside className="w-full md:w-60 shrink-0">
      <div className="bg-white rounded-xl border border-[#E5E8EC] p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-[#68707A] uppercase tracking-wider">
          Navigasi Admin
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#17191C] hover:bg-[#F1F3F5]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#68707A]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F1F3F5] text-[#68707A]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

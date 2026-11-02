import React from 'react';
import { Film, Shield, LogOut, Plus, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface AppHeaderProps {
  isAdminLoggedIn: boolean;
  isAdminView: boolean;
  adminEmail?: string | null;
  adminPhoto?: string | null;
  onToggleAdminView: (view: boolean) => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onNavigateToAddLink?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isAdminLoggedIn,
  isAdminView,
  adminEmail,
  adminPhoto,
  onToggleAdminView,
  onOpenLoginModal,
  onLogout,
  onNavigateToAddLink,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E8EC] h-16 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onToggleAdminView(false)}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-lg p-1 -ml-1 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-2xs">
              <Film className="w-4 h-4 stroke-2" />
            </div>
            <div>
              <span className="text-base font-bold text-[#17191C] tracking-tight">Filmove</span>
              <span className="hidden sm:inline-block text-[11px] text-[#68707A] ml-2 font-normal">
                Katalog Telegram
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-[#68707A]">
            <button
              onClick={() => onToggleAdminView(false)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                !isAdminView ? 'bg-[#F1F3F5] text-[#17191C]' : 'hover:text-[#17191C]'
              }`}
            >
              Koleksi Film
            </button>
            {isAdminLoggedIn && (
              <button
                onClick={() => onToggleAdminView(true)}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  isAdminView ? 'bg-[#F1F3F5] text-[#17191C]' : 'hover:text-[#17191C]'
                }`}
              >
                Dasbor Admin
              </button>
            )}
          </nav>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {isAdminLoggedIn ? (
            <>
              {/* Admin Identity Badge */}
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#F7F8FA] border border-[#E5E8EC] text-xs">
                {adminPhoto ? (
                  <img
                    src={adminPhoto}
                    alt="Admin"
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
                )}
                <span className="text-[#17191C] font-medium text-[11px] max-w-[140px] truncate" title={adminEmail || ''}>
                  {adminEmail || 'Admin'}
                </span>
              </div>

              {isAdminView ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleAdminView(false)}
                    leftIcon={<Home className="w-3.5 h-3.5" />}
                  >
                    Lihat Publik
                  </Button>
                  {onNavigateToAddLink && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onNavigateToAddLink}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Tambah Link
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleAdminView(true)}
                  leftIcon={<Shield className="w-3.5 h-3.5 text-[#2563EB]" />}
                >
                  Panel Admin
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                leftIcon={<LogOut className="w-3.5 h-3.5 text-[#68707A]" />}
                className="text-[#68707A]"
                title="Keluar dari akun admin"
              >
                Keluar
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenLoginModal}
              leftIcon={<Shield className="w-3.5 h-3.5 text-[#68707A]" />}
            >
              Masuk Admin
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

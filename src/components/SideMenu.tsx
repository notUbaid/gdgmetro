import { useState, useEffect } from 'react';
import { Menu, X, Route, Moon, Sun, Lightbulb, Coffee, CreditCard, Check, ArrowLeftRight, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { TipsDialog } from './TipsDialog';
import { CommuteSetup } from './CommuteSetup';
import { useMetroCard } from '@/contexts/MetroCardContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCommuteSettings } from '@/lib/commuteStorage';
import { checkForUpdates, applyUpdate } from '@/lib/pwaUpdate';
import { toast } from 'sonner';
import { Languages } from 'lucide-react';
import { t } from '@/lib/i18n';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface SideMenuProps {
  onOpenRoutePlanner: (origin?: string, destination?: string) => void;
  onOpenMultimodalPicker?: () => void;
}

const GooglePlayIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none">
    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 59.9z" fill="#00E676"/>
    <path d="M47 38.6c-5.7 6.4-9 15.3-9 25.8v383.2c0 10.5 3.3 19.4 9 25.8l219.7-219.7L47 38.6z" fill="#00B0FF"/>
    <path d="M325.3 277.7l60.1 60.1-280.8 161.2 220.7-221.3z" fill="#FF3D00"/>
    <path d="M465 238.4l-79.6-45.7-60.1 59.9 60.1 60.1 79.6-45.7c15.2-8.7 15.2-22.9 0-31.6z" fill="#FFC107"/>
  </svg>
);

export const SideMenu = ({ onOpenRoutePlanner, onOpenMultimodalPicker }: SideMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isCommuteOpen, setIsCommuteOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isAndroidWebUser, setIsAndroidWebUser] = useState(false);
  const {
    hasMetroCard,
    setHasMetroCard,
    dailySpent,
    dailyCap,
    isCapReached,
    hasUnlimitedDayPass,
    setHasUnlimitedDayPass,
    resetDailySpend,
  } = useMetroCard();
  const { language, setLanguage } = useLanguage();
  const commuteSettings = getCommuteSettings();

  useEffect(() => {
    // Detect Android web users (exclude iOS, desktop, and already-installed PWA/Play Store TWA)
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      const isAndroid = /android/i.test(ua);
      const isIOS = /iphone|ipad|ipod/i.test(ua);

      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        ('standalone' in navigator && Boolean((navigator as unknown as { standalone?: boolean }).standalone)) ||
        document.referrer.startsWith('android-app://') ||
        ua.includes('wv');

      if (isAndroid && !isIOS && !isStandalone) {
        setIsAndroidWebUser(true);
      }
    }

    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme');

    if (stored === 'dark' || (!stored && prefersDark)) {
      root.classList.add('dark');
      setIsDark(true);
    }

    let promptTimeout: NodeJS.Timeout;

    const handleBeforeInstallPrompt = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstallable(true);

      // Auto-prompt after 30 seconds of usage
      promptTimeout = setTimeout(() => {
        const triggerPrompt = async () => {
          document.removeEventListener('click', triggerPrompt);
          document.removeEventListener('touchstart', triggerPrompt);
          try {
            await event.prompt();
            const { outcome } = await event.userChoice;
            if (outcome === 'accepted') {
              setIsInstallable(false);
            }
            setDeferredPrompt(null);
          } catch (err) {
            console.log('Auto-prompt prevented by browser', err);
          }
        };
        // Wait for the next user interaction to trigger it to satisfy browser requirements
        document.addEventListener('click', triggerPrompt);
        document.addEventListener('touchstart', triggerPrompt);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(promptTimeout);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const newIsDark = !isDark;

    if (newIsDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    setIsDark(newIsDark);
  };

  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleCheckForUpdates = async () => {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    toast.info(t('update.checking', language));
    try {
      const res = await checkForUpdates();
      if (res.status === 'updated') {
        toast.success(t('update.updating', language));
        setTimeout(() => {
          applyUpdate();
        }, 800);
      } else if (res.status === 'offline') {
        toast.error(t('offline.usingCached', language));
      } else if (res.status === 'error') {
        toast.error(t('update.failed', language));
      } else {
        toast.success(t('update.latest', language));
      }
    } catch {
      toast.error(t('update.failed', language));
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleRoutePlanner = () => {
    setIsOpen(false);
    onOpenRoutePlanner();
  };

  const menuItems = [
    {
      icon: Route,
      label: t('menu.planRoute', language),
      onClick: handleRoutePlanner,
      description: t('menu.planRouteDesc', language)
    },
    {
      icon: ArrowLeftRight,
      label: t('menu.dailyCommute', language),
      onClick: () => {
        setIsOpen(false);
        setIsCommuteOpen(true);
      },
      description: commuteSettings ? t('menu.commuteConfigured', language) : t('menu.dailyCommuteDesc', language),
      customIconColor: commuteSettings ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground',
      customBgColor: commuteSettings ? 'bg-purple-500/15' : 'bg-muted',
      isToggle: commuteSettings !== null,
      isActive: commuteSettings !== null
    },
    {
      icon: CreditCard,
      label: 'Janmitra RuPay NCMC Pass',
      onClick: () => setHasMetroCard(!hasMetroCard),
      description: hasMetroCard ? '10% off Metro, BRTS & AMTS + ₹50 cap' : 'Tap to enable NCMC contactless discount',
      customIconColor: hasMetroCard ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
      customBgColor: hasMetroCard ? 'bg-emerald-500/15' : 'bg-muted',
      isToggle: true,
      isActive: hasMetroCard
    },
    {
      icon: RefreshCw,
      label: isCheckingUpdate ? t('update.checking', language) : t('menu.checkForUpdates', language),
      onClick: handleCheckForUpdates,
      description: t('menu.checkForUpdatesDesc', language),
      customIconColor: isCheckingUpdate ? 'text-blue-500 animate-spin' : 'text-blue-600 dark:text-blue-400',
      customBgColor: 'bg-blue-500/15'
    },
    {
      icon: isDark ? Sun : Moon,
      label: isDark ? t('menu.lightMode', language) : t('menu.darkMode', language),
      onClick: toggleTheme,
      description: t('menu.themeDesc', language)
    },
    {
      icon: Lightbulb,
      label: 'Ek Safar — PS-08',
      onClick: () => {
        setIsOpen(false);
        if (onOpenMultimodalPicker) {
          onOpenMultimodalPicker();
        } else {
          window.dispatchEvent(new CustomEvent('open-multimodal-modal'));
        }
      },
      description: 'One City, One Journey • Unified Multimodal Platform',
      customIconColor: 'text-indigo-600 dark:text-indigo-400',
      customBgColor: 'bg-indigo-500/15'
    },
    {
      icon: Lightbulb,
      label: t('menu.tips', language),
      onClick: () => {
        setIsOpen(false);
        setIsTipsOpen(true);
      },
      description: t('menu.tipsDesc', language),
      disabled: false
    },
    ...(isAndroidWebUser ? [{
      icon: GooglePlayIcon,
      label: t('menu.playStore', language),
      onClick: () => {
        setIsOpen(false);
        window.open('https://eksafar.transit', '_blank', 'noopener,noreferrer');
      },
      description: t('menu.playStoreDesc', language),
      customIconColor: '',
      customBgColor: 'bg-emerald-500/15'
    }] : (isInstallable ? [{
      icon: Download,
      label: t('menu.installApp', language),
      onClick: handleInstallClick,
      description: t('menu.installAppDesc', language),
      customIconColor: 'text-blue-600 dark:text-blue-400',
      customBgColor: 'bg-blue-500/15'
    }] : [])),
  ];

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        className="fixed top-4 right-4 z-[1001] p-3 glass-panel rounded-xl shadow-lg border border-border hover:bg-muted transition-colors pointer-events-auto safe-m-top hover-scale"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[1002] bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-72 z-[1003] glass-panel border-l shadow-2xl transition-transform duration-300 ease-out will-change-transform transform-gpu flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-lg">{t('menu.title', language)}</h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-2 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${item.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-muted'
                }`}
            >
              <div className={`p-2 rounded-lg ${item.disabled ? 'bg-muted/50' : (item.customBgColor || 'bg-primary/10')}`}>
                <item.icon className={`w-5 h-5 ${item.disabled ? 'text-muted-foreground' : (item.customIconColor || 'text-primary')}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {item.isToggle && (
                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                  item.isActive ? 'bg-green-500 text-white' : 'bg-muted border border-border'
                }`}>
                  {item.isActive && <Check size={14} />}
                </div>
              )}
            </button>
          ))}

          {/* Janmitra RuPay NCMC / Ek Safar Smart Pass Spend Tracker */}
          {hasMetroCard && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-card to-card border border-emerald-500/30 space-y-2.5 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">Janmitra RuPay NCMC Pass</h4>
                    <p className="text-[10px] text-muted-foreground">Automatic ₹50 Daily Fare Cap</p>
                  </div>
                </div>
                {isCapReached ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Cap Reached!</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                    ₹{dailySpent} / ₹{dailyCap}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, (dailySpent / dailyCap) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-muted-foreground">
                  {isCapReached
                    ? 'Subsequent trips today are free (₹0 fare)!'
                    : `₹${Math.max(0, dailyCap - dailySpent)} remaining until free travel today`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
                <button
                  onClick={() => setHasUnlimitedDayPass(!hasUnlimitedDayPass)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[10.5px] font-semibold border transition-all cursor-pointer ${
                    hasUnlimitedDayPass
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-muted/60 hover:bg-muted border-border text-foreground'
                  }`}
                >
                  {hasUnlimitedDayPass ? 'Day Pass Active (₹50)' : 'Activate Day Pass (₹50)'}
                </button>
                {dailySpent > 0 && (
                  <button
                    onClick={resetDailySpend}
                    className="py-1 px-2 rounded-lg text-[10.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Language Selector */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Languages className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">{t('menu.language', language)}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-background/80 rounded-lg border border-border/40">
              <button
                onClick={() => setLanguage('en')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('gu')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                  language === 'gu'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                ગુજરાતી
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                  language === 'hi'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-border/50 bg-background/50 safe-p-bottom">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="bg-muted/50 p-2 rounded-lg text-[10px] text-muted-foreground leading-relaxed w-full border border-border/50">
              <span className="font-semibold block mb-1">{t('menu.disclaimer', language)}</span>
              {t('menu.disclaimerGovt', language)} {t('menu.disclaimerSource', language)} <a href="https://www.gujaratmetrorail.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{t('menu.gmrc', language)}</a>.
            </div>
            
            <div className="flex items-center justify-between w-full px-1 mt-1">
              <p className="text-xs text-muted-foreground font-medium">
                v1.2.1 • {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())}
              </p>
              <p className="text-xs text-muted-foreground/70">
                Ek Safar • DevFest Metro Hackathon
              </p>
            </div>
          </div>
        </div>
      </div>

      <TipsDialog isOpen={isTipsOpen} onOpenChange={setIsTipsOpen} />
      <CommuteSetup isOpen={isCommuteOpen} onClose={() => setIsCommuteOpen(false)} />
    </>
  );
};

export default SideMenu;

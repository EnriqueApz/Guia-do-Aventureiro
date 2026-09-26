import * as Popover from '@radix-ui/react-popover';
import { Monitor, Moon, Settings2, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { useSettings, type ThemePreference } from '@/state/settings';

export function SettingsMenu() {
  const { theme, largeText, reduceMotion, setTheme, setLargeText, setReduceMotion } = useSettings();

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="fantasma" size="icone" aria-label="Ajustes de leitura e tema">
          <Settings2 aria-hidden className="size-5" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[min(22rem,calc(100vw-1.5rem))] space-y-4 rounded-card border border-line-strong bg-surface p-5 shadow-card"
        >
          <h2 className="text-lg font-semibold">Ajustes</h2>
          <Segmented<ThemePreference>
            legend="Tema"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'claro', label: 'Pergaminho', icon: <Sun aria-hidden className="size-4" /> },
              { value: 'escuro', label: 'Vela', icon: <Moon aria-hidden className="size-4" /> },
              { value: 'sistema', label: 'Auto', icon: <Monitor aria-hidden className="size-4" /> },
            ]}
          />
          <Switch
            label="Fonte maior"
            hint="Aumenta todo o texto do site."
            checked={largeText}
            onCheckedChange={setLargeText}
          />
          <Switch
            label="Menos animações"
            hint="Desliga dados rolando e transições."
            checked={reduceMotion}
            onCheckedChange={setReduceMotion}
          />
          <Popover.Arrow className="fill-line-strong" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

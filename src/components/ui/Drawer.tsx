import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/** Gaveta que sobe da parte de baixo da tela; usada para a ficha no celular. */
export function Drawer({ open, onOpenChange, title, description, children }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-2xl border-t border-line-strong bg-surface shadow-card outline-none"
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-line-strong" />
          <div className="flex items-center justify-between gap-4 px-5 pt-3 pb-2">
            <div>
              <Dialog.Title className="font-display text-xl font-semibold">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-ink-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <Button variant="fantasma" size="icone" aria-label="Fechar">
                <X aria-hidden className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

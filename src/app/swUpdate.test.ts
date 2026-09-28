import { afterEach, describe, expect, it, vi } from 'vitest';
import { keepUpdated } from './swUpdate';

function fakeServiceWorker(controller: object | null) {
  const sw = new EventTarget() as EventTarget & {
    controller: object | null;
    getRegistration: () => Promise<{ update: () => Promise<void> }>;
  };
  const update = vi.fn(() => Promise.resolve());
  sw.controller = controller;
  sw.getRegistration = () => Promise.resolve({ update });
  Object.defineProperty(navigator, 'serviceWorker', { value: sw, configurable: true });
  const reload = vi.fn();
  Object.defineProperty(window, 'location', {
    value: { ...window.location, reload },
    configurable: true,
  });
  return { sw, reload, update };
}

describe('site sempre atualizado', () => {
  const location = window.location;
  afterEach(() => {
    Object.defineProperty(window, 'location', { value: location, configurable: true });
  });

  it('recarrega uma vez quando uma versão nova assume', () => {
    const { sw, reload } = fakeServiceWorker({});
    keepUpdated();
    sw.dispatchEvent(new Event('controllerchange'));
    sw.dispatchEvent(new Event('controllerchange'));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('não recarrega na primeira visita', () => {
    const { sw, reload } = fakeServiceWorker(null);
    keepUpdated();
    sw.dispatchEvent(new Event('controllerchange'));
    expect(reload).not.toHaveBeenCalled();
  });

  it('procura versão nova ao voltar para a aba', async () => {
    const { update } = fakeServiceWorker({});
    keepUpdated();
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() => expect(update).toHaveBeenCalled());
  });
});

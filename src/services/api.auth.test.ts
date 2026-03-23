import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authGetUserMock: vi.fn(),
  fromMock: vi.fn()
}));

vi.mock('../supabase-client', () => ({
  supabase: {
    auth: {
      getUser: mocks.authGetUserMock
    },
    from: mocks.fromMock
  }
}));

import { api } from './api';

describe('api auth gating (gold pricing)', () => {
  beforeEach(() => {
    mocks.authGetUserMock.mockReset();
    mocks.fromMock.mockReset();
  });

  it('getPrices: returns [] and does not query when no authenticated email', async () => {
    mocks.authGetUserMock.mockResolvedValueOnce({ data: { user: null }, error: null });

    const prices = await api.getPrices();
    expect(prices).toEqual([]);
    expect(mocks.fromMock).not.toHaveBeenCalled();
  });

  it('getPricingSettings: returns null and does not query when no authenticated email', async () => {
    mocks.authGetUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1', email: null } }, error: null });

    const settings = await api.getPricingSettings();
    expect(settings).toBeNull();
    expect(mocks.fromMock).not.toHaveBeenCalled();
  });

  it('getLatestOuncePriceUsd: returns null and does not query when no authenticated email', async () => {
    mocks.authGetUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });

    const latest = await api.getLatestOuncePriceUsd();
    expect(latest).toBeNull();
    expect(mocks.fromMock).not.toHaveBeenCalled();
  });

  it('getPrices: queries DB when authenticated email exists', async () => {
    mocks.authGetUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null });

    const orderMock = vi.fn().mockResolvedValueOnce({
      data: [
        { karat: 24, buy: 1.2, sell: 1.3 },
        { karat: 21, buy: 1.0, sell: 1.1 }
      ],
      error: null
    });
    const selectMock = vi.fn(() => ({ order: orderMock }));
    mocks.fromMock.mockReturnValueOnce({ select: selectMock });

    const prices = await api.getPrices();
    expect(mocks.fromMock).toHaveBeenCalledWith('prices');
    expect(selectMock).toHaveBeenCalled();
    expect(orderMock).toHaveBeenCalled();
    expect(prices).toEqual([
      { karat: 24, buy: 1.2, sell: 1.3 },
      { karat: 21, buy: 1.0, sell: 1.1 }
    ]);
  });
});

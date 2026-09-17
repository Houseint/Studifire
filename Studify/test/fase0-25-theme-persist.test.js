const mockOpenDatabaseAsync = jest.fn(() => Promise.resolve(null));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: mockOpenDatabaseAsync,
}));

const { createMemoryDb } = require('./helpers/sqliteMemory');

describe('Tema persistido: theme_mode no user_settings', () => {
  let subjectsDb;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      subjectsDb = require('../src/services/subjectsDb');
    });
  });

  async function setupDb() {
    const memDb = await createMemoryDb();
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);
    return memDb;
  }

  test('settings novas já vêm com theme_mode dark', async () => {
    await setupDb();
    const settings = await subjectsDb.getUserSettings(1);
    expect(settings.theme_mode).toBe('dark');
  });

  test('update/get roundtrip: light persiste', async () => {
    await setupDb();
    expect(await subjectsDb.updateThemeMode(1, 'light')).toEqual({ theme_mode: 'light' });
    expect((await subjectsDb.getUserSettings(1)).theme_mode).toBe('light');
  });

  test('valor inválido cai em dark (nunca quebra o app)', async () => {
    await setupDb();
    expect(await subjectsDb.updateThemeMode(1, 'rosa-choque')).toEqual({ theme_mode: 'dark' });
    expect((await subjectsDb.getUserSettings(1)).theme_mode).toBe('dark');
  });

  test('trocar o tema preserva meta e lembrete (UPDATE, não REPLACE)', async () => {
    await setupDb();
    await subjectsDb.updateWeeklyGoal(1, 600);
    await subjectsDb.updateReminderSettings(1, { enabled: true, hour: 8, minute: 30 });
    await subjectsDb.updateThemeMode(1, 'light');
    const settings = await subjectsDb.getUserSettings(1);
    expect(settings.theme_mode).toBe('light');
    expect(settings.weekly_goal_minutes).toBe(600);
    expect(settings.reminder_enabled).toBe(1);
    expect(settings.reminder_hour).toBe(8);
  });
});

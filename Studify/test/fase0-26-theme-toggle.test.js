import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';

jest.mock('../src/features/auth/authDb', () => ({
  getSessionUser: jest.fn(),
  getUserById: jest.fn(),
  logoutUser: jest.fn(),
  atualizarAvatar: jest.fn(),
}));

jest.mock('../src/features/subjects/subjectsDb', () => ({
  updateWeeklyGoal: jest.fn(),
  getUserSettings: jest.fn(),
  updateReminderSettings: jest.fn(),
  updateThemeMode: jest.fn(),
  getUserBadges: jest.fn(),
  checkAndAwardBadges: jest.fn(),
  getProfileStats: jest.fn(),
  getWeeklyGoalProgress: jest.fn(),
}));

jest.mock('../src/features/reminders/reminderService', () => ({
  requestReminderPermission: jest.fn(),
  enableDailyReminder: jest.fn(),
  disableDailyReminder: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

import { getSessionUser, getUserById } from '../src/features/auth/authDb';
import { getUserSettings, updateThemeMode } from '../src/features/subjects/subjectsDb';
import { ThemeProvider } from '../src/shared/theme/ThemeContext';

const ProfileScreen = require('../src/screens/ProfileScreen').default;

const navigation = { reset: jest.fn(), goBack: jest.fn(), navigate: jest.fn() };

function renderProfile() {
  const { NavigationContainer } = require('@react-navigation/native');
  return render(
    <NavigationContainer>
      <ThemeProvider>
        <ProfileScreen navigation={navigation} />
      </ThemeProvider>
    </NavigationContainer>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  getSessionUser.mockResolvedValue({ id: 1, email: 'a@b.com' });
  getUserById.mockResolvedValue({ id: 1, email: 'a@b.com', avatar: null });
  getUserSettings.mockResolvedValue({
    reminder_enabled: 0, reminder_hour: 20, reminder_minute: 0, theme_mode: 'dark',
  });
  updateThemeMode.mockResolvedValue({ theme_mode: 'light' });
  const subjects = require('../src/features/subjects/subjectsDb');
  subjects.checkAndAwardBadges.mockResolvedValue([]);
  subjects.getProfileStats.mockResolvedValue({});
  subjects.getWeeklyGoalProgress.mockResolvedValue({ goalMinutes: 300, currentMinutes: 0, percent: 0 });
  subjects.getUserBadges.mockResolvedValue([]);
});

test('Perfil tem ícone sol no header (dark) e alterna p/ lua persistindo claro', async () => {
  const screen = renderProfile();

  // Sem seção Aparência: toggle é o ícone no canto superior direito
  expect(screen.queryByText('🎨 Aparência')).toBeNull();
  expect(await screen.findByText('☀️')).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText('☀️'));
  });

  await waitFor(() => {
    expect(updateThemeMode).toHaveBeenCalledWith(1, 'light');
  });
  expect(await screen.findByText('🌙')).toBeTruthy();
});

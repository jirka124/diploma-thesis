import { boot } from 'quasar/wrappers';
import { useExerciseSettings } from 'src/composables/settings/exercise';
import { useNotificationSettings } from 'src/composables/settings/notification';
import { useThemeSettings } from 'src/composables/settings/theme';

export default boot(async () => {
  const theme = useThemeSettings();
  const exercise = useExerciseSettings();
  const notification = useNotificationSettings();

  await Promise.all([
    theme.initTheme(),
    exercise.initExerciseSettings(),
    notification.initNotificationSettings(),
  ]);
});

import { boot } from 'quasar/wrappers';
import { useTheme } from 'src/composables/theme';

export default boot(() => {
  const t = useTheme();
  t.initTheme();
});

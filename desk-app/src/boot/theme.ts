import { boot } from 'quasar/wrappers';
import { applyThemeFromStorage } from 'src/composables/theme';

export default boot(() => {
  applyThemeFromStorage();
});

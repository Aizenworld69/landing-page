import HomeClient from './HomeClient';
import { getPopupConfigAction } from './actions';

export default async function Page() {
  const popupConfig = await getPopupConfigAction();
  return <HomeClient initialPopupConfig={popupConfig} />;
}

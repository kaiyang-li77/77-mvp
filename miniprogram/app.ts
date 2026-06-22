import { setBodyProfile, setStylePreference, setCustomSelection } from "./data/app-state";
import { defaultBodyProfile, defaultStylePreference, customOptions } from "./data/mock-data";

App<IAppOption>({
  globalData: {},
  onLaunch() {
    setBodyProfile(defaultBodyProfile);
    setStylePreference(defaultStylePreference);
    setCustomSelection({
      garment: "大衣",
      fabric: customOptions.fabrics[0].name,
      color: "深石墨黑",
      fit: "合体",
      details: ["暖金纽扣", "半里布"]
    });
  }
});

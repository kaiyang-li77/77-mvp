App<IAppOption>({
  globalData: {},
  onLaunch() {
    wx.cloud.init({
      env: 'kycloud-cloudbase-d8dy5236df1413',
      traceUser: true
    });
  }
});

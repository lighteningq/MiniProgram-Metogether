//app.js
const db = wx.cloud.database
App({
  onLaunch: function () {
    this.globalData = {}

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }


    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    // get user setting
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // this.setData({
              //   avatarUrl: res.userInfo.avatarUrl,
              //   userInfo: res.userInfo
              // })
              // console.log('user info', this.data.userInfo)
            }
          })
        }
      }
    })

    // cloudfunction to get user's openid 
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        let openid = res.result.openid;
        this.globalData.openid = res.result.openid
        console.log('[云函数] [login] user openid: ', this.globalData)
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })

  }
})

//index.js
const app = getApp()
const db = wx.cloud.database()
var key = -1


Page({
  data: {
    matchMatrix: [],
    users: [],
    myProfile: [],
    openid:'',
    myIndex:'',
    myPastSwipes:[]
  },

  onLaunch: function(){
   
  },

  onShow: function(){ 

 
  },

  onLoad: function() {
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid
      })
    }



  //  // get user index in real time when every key value pair is given by an open id
  //  db.collection('idHashtable').where({
  //    _openid : this.data.openid
  //  }).get({
  //    success : res=>{
  //      this.setData({
  //        myIndex : res.data
  //      })
  //    },
  //    fail: err =>{
  //      wx.showToast({
  //        title:'failed on query on [myIndex]'
  //      })
  //      console.error('[database][query myIndex] failed',err)
  //    }
  //  })


    // get and set current user index
     db.collection('idHashtable').where({
       _id: "hashtable",
    }).get({
      success: res=>{
        console.log(res.data)
        let id = app.globalData.openid
        let index = res.data[0].hash.indexOf(id)
        this.setData({
          myIndex : index
        })
        console.log('myIndex is: ',this.data.myIndex);
      }
     
    })


    // load matchmatrix
    db.collection('matchingindex').where({}).get({
      success: res => {
        let result = res.data;
        this.setMatrix(result)
        console.log('[数据库-matchingMatrix] [查询记录] 成功: ', this.data.matchMatrix)
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
        console.error('[数据库-matchingMatrix] [查询记录] 失败：', err)
      }
    })


// load users data
    db.collection('users').where({}).get({
      success: res => {
        let result = res.data;
        this.setUsers(result);
        console.log('[Database] [Query] Success: ', this.data.users)
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: 'Fail!'
        })
        console.error('[Database] [Query] Fail：', err)
      }
    })




 



   


  
    
  },


// for swiping functions
  handleSwipeOut(...args) {
     console.log(args)
    let direction = args[0].detail.direction
    let index = args[0].detail.item.key
    
    this.updateMatrix(index, direction);

  },

  handleClickCard(...args) {
    // console.log(args)
  },


  setMatrix(result) {
    let matchMatrix = []
    let myPastSwipes = []
    let res = result[0].matchingMatrix
    for (let i = 0; i < res.length; i++) {
      matchMatrix.push(res[i])
      if(i===this.data.myIndex){
        myPastSwipes=res[i]
        console.log("Pre-Op, [my Current Index is]:",this.data.myIndex)
        this.setData({
          myPastSwipes : myPastSwipes
        })
      }
    }
    this.setData({
      matchMatrix: matchMatrix
    })
    // console.log('matrix: ',matchMatrix);
    console.log("My past swipes: ",this.data.myPastSwipes)
  },

  setUsers(result) {
    let users = []
    let res = result[0].users


    // delete current user index from the database
    // to prevent user to swipe on themselves
    
    // console.log("Set user data : ", res)

    //deleted all the profiles that the user already swiped
    let pastswipes = this.data.myPastSwipes
    res.splice(this.data.myIndex, 1)
    for (let i =0; i<pastswipes.length;i++){
      if (pastswipes[i]!== 0){
        // delete the current user info
        res.splice(i,1)
      }
    }
    users=users.concat(res)
      this.setData({
        users: users
      })
      console.log("users",users);
    

  },





  updateMatrix (index,direction){
    // new value in the matrix 
    var myIdx = this.data.myIndex
    
    var updateVal = "matchMatrix["+myIdx+"][" + index + "]"
    var updatePastSwp = "myPastSwipes[" + index + "]"
    if (direction==='right'){
    this.setData({
      [updateVal]: 1,
      [updatePastSwp]:1
    });
    // if the other user is already swiped right on you
    if (this.data.matchMatrix[index][this.data.myIndex]===1){
      console.log("it is a match!");
      // wx.navigateTo({
      //   url: '../matchWindow/matchWindow',
      // })
    
    }
    } else if (direction==='left'){
      this.setData({
        [updateVal]: -1,
        [updatePastSwp]: -1
      });
    }
  },

setOpenid(openid){
  this.setData({
    openid: openid
  })
},


 






























  onGetUserInfo: function(e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onGetOpenid() {
    // action on cloudfunction 'login'
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        let openid = res.result.openid
        console.log('[云函数] [login] user openid: ', openid)
        app.globalData.openid = res.result.openid

        this.setData({
          openid : openid 
        })
        // wx.navigateTo({
        //   url: '../userConsole/userConsole',
        // })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  // upload img  to cloud
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        
        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            
            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },



// // past set userdata
// not use it any more
//   setUsersInfo(result) {
//     let users = []
//     let res = result[0].users
//     console.log("result", res)
//     for (let i = 0; i < res.length; i++) {
//       users.push({
//         age: res[i].birthDay,
//         gender: res[i].gender,
//         lastLogLoc: res[i].lastloginLocation,
//         location: res[i].location,
//         organization: res[i].organization,
//         profilePic: res[i].profilePic,
//         unionID: res[i].unionID,
//         name: res[i].name
//       })

//       this.setData({
//         users: users
//       })
//       // console.log(users);
//     }

//   },

})

Page({
  data: { imagePath: '', uploading: false, score: null, error: '' },
  chooseImage() {
    wx.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album','camera'], success: (res) => {
      const path = res.tempFilePaths[0]; this.setData({ imagePath: path, score: null, error: '' })
    }, fail: (err)=>{ this.setData({ error: '选择图片失败: ' + (err.errMsg || '') }) } })
  },
  submit(){
    const { imagePath } = this.data
    if(!imagePath){ this.setData({ error: '请先选择图片' }); return }
    this.setData({ uploading: true, error: '' })
    const api = require('../../utils/api')
    api.scoreImage(imagePath)
      .then(score => { this.setData({ score, uploading: false }) })
      .catch(err => { this.setData({ error: err.message || '评分失败', uploading: false }) })
  },
  reset(){ this.setData({ imagePath: '', score: null, error: '' }) }
})

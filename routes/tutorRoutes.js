const express = require('express');
const router = express.Router();

// 中介層：JWT 驗證
const auth = require('../middlewares/authMiddleware');

// 控制器
const {
    createTutor,
    getMyTutorPosts,
    deleteTutorPost,
    updateTutorPost,
    getAllTutors,
    filterTutors, 
} = require('../controllers/tutorController');
  
// ✅ 發布家教資訊（僅限學生）
router.post('/', auth, createTutor);

// ✅ 查看自己已發布的家教資訊
router.get('/my', auth, getMyTutorPosts);

// ✅ 刪除指定家教資訊（僅限本人）
router.delete('/:id', auth, deleteTutorPost);

// ✅ 修改家教資訊
router.put('/:id', auth, updateTutorPost);

// ✅ 顯示所有學生發布的家教資訊（公開）
router.get('/', getAllTutors);

//✅ 篩選發布家教資訊（公開）
router.get('/filter', filterTutors);
module.exports = router;

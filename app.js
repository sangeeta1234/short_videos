const express = require("express")
const app = express()
const multer = require('multer');
const createVideosController = require('./controller/createVideosController')
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
  
  const upload = multer({ storage: storage });

// Handle file upload
app.post('/upload', upload.single('videoFile'),createVideosController.createVideos);
app.get("/getvideo",createVideosController.createVideos)
app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/index.html');
})

app.listen(5001,(req,res)=>{
    console.log("app is running")
})
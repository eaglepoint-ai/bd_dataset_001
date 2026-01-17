const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "../public_html/userdata/media")
    },
    filename: (req, file, cb) => {
        let imageFileName = Date.now() + path.extname(file.originalname);
        req.imageName = imageFileName;
        cb(null, imageFileName);
    }
});

const upload = multer({ storage: storage });

module.exports = upload;

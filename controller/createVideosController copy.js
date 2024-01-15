const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegStatic);
const fs = require('fs');
const path = require('path');

let createvideoController = {}

createvideoController.createVideos = (req,res)=>{
    // Input video path
const inputVideoPath = req.file;
console.log(inputVideoPath)
console.log(inputVideoPath.originalname)

const fileExtension = path.extname(inputVideoPath.originalname);

// Output directory for short videos
const outputDir = './uploads';

// Number of short videos to create (adjust as needed)
const numberOfVideos =  req.body.numberOfVideos || 2

// Calculate the duration for each short video
const totalDuration = 176; // total duration of the long video in seconds
const durationPerVideo = totalDuration / numberOfVideos;

// Create short videos

const FileCreation  = new Promise((resolve,reject)=>{
    for (let i = 0; i < numberOfVideos; i++) {
        let outPutFileName = `video_${i + 1}${fileExtension}`;
        const outputVideoPath = path.join(outputDir, outPutFileName);
    
        const startTime = i * durationPerVideo;
        const endTime = startTime + durationPerVideo;
    
        // Create a command
        const command = ffmpeg().input(inputVideoPath.path)
            .setStartTime(startTime)
            .setDuration(durationPerVideo)
            .outputOptions('-b:v', '512k')
            .on('progress', (progress) => {
                if (progress.percent) {
                console.log(`Processing: ${Math.floor(progress.percent)}% done`);
                }
            })// The callback that is run when FFmpeg is finished
            .saveToFile(outputVideoPath)
            .on('end', () => {
                res.setHeader('Content-Disposition', `attachment; filename=${outputDir}/${outPutFileName}`);
                res.sendFile(outputDir+'/'+outPutFileName, {}, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    reject(false)
                    res.status(500).send('Internal Server Error');
                } else {
                    // Delete the file after sending it
                    fs.unlink(outputDir+'/'+outPutFileName, (deleteErr) => {
                    if (deleteErr) {
                        console.error('Error deleting file:', deleteErr);
                    } else {
                        console.log('File deleted successfully.');
                        console.log('FFmpeg has finished.');
                    }
                    });
                    resolve(true)
                }
                });
    
            })
            // The callback that is run when FFmpeg encountered an error
            .on('error', (error) => {
                console.error(error);
                reject(false)
            });
        }
})

FileCreation.then(()=>{
    fs.unlink(inputVideoPath.path, (deleteErr) => {
        if (deleteErr) {
            console.error('Error deleting file:', deleteErr);
        } else {
            console.log('File deleted successfully.');
        }
        });
}).catch((deleteErr) => {
    console.error('Error deleting file:', deleteErr);
});

}


module.exports = createvideoController;
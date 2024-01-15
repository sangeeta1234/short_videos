const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegStatic);
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { getVideoDuration } = require('../videoUtils');

let createvideoController = {};

createvideoController.createVideos = async (req, res) => {
    const inputVideoPath = req.file;
    const totalDuration = await getVideoDuration(inputVideoPath.path);
    const fileExtension = path.extname(inputVideoPath.originalname);
    const outputDir = './uploads';
    const numberOfVideos = req.body.numberOfVideos || 2;
    const durationPerVideo = totalDuration / numberOfVideos;

    const unlink = async (filePath) => {
        try {
            await fs.unlink(filePath);
            console.log('File deleted successfully:', filePath);
        } catch (deleteErr) {
            console.error('Error deleting file:', deleteErr);
        }
    };

    try {
        const fileArr = [];
        for (let i = 0; i < numberOfVideos; i++) {
            const outPutFileName = `video_${i + 1}${fileExtension}`;
            const outputVideoPath = path.join(outputDir, outPutFileName);
            const startTime = i * durationPerVideo;

            const createVideoPromise = new Promise((resolve, reject) => {
                ffmpeg()
                    .input(inputVideoPath.path)
                    .setStartTime(startTime)
                    .setDuration(durationPerVideo)
                    .outputOptions('-b:v', '512k')
                    .saveToFile(outputVideoPath)
                    .on('progress', (progress) => {
                        if (progress.percent) {
                            console.log(`Processing: ${Math.floor(progress.percent)}% done`);
                        }
                    })
                    .on('end', async () => {
                        try {
                            const absoluteOutputPath = path.resolve(outputVideoPath);
                            fileArr.push(absoluteOutputPath);
                            resolve(true);
                        } catch (err) {
                            console.error('Error sending or deleting file:', err);
                            reject(false);
                        }
                    })
                    .on('error', (error) => {
                        console.error('Error during FFmpeg processing:', error);
                        reject(false);
                    })
            });

            await createVideoPromise;
        }

        // Create a zip archive
        const zipFileName = 'outputFiles.zip';
        const zipFilePath = path.join(outputDir, zipFileName);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Compression level
        });

        // Pipe archive data to the response
        archive.pipe(res);

        // Add each file to the archive
        for (const absoluteOutputPath of fileArr) {
            const fileName = path.basename(absoluteOutputPath);
            const fileBuffer = await fs.readFile(absoluteOutputPath);
            archive.append(fileBuffer, { name: fileName });
        }


        // Finalize the archive and trigger the response
        archive.finalize();

        // Optionally, you can perform additional actions after sending the zip file
        archive.on('end', async () => {
            // Delete all the input files after creating the zip archive
            for (const absoluteOutputPath of fileArr) {
                await unlink(absoluteOutputPath);
            }

            // Delete the input video file after creating the zip archive
            await unlink(inputVideoPath.path);

            console.log(`Zip file ${zipFilePath} sent successfully.`);
            res.status(200).send(`Zip filed created and downloaded successfully.`);
        });
    } catch (err) {
        console.error('Error creating videos:', err);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = createvideoController;

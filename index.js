const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegStatic);

const path = require('path');

// Input video path
const inputVideoPath = './record1_test.mov';

// Output directory for short videos
const outputDir = './';

// Number of short videos to create (adjust as needed)
const numberOfVideos = 2;

// Calculate the duration for each short video
const totalDuration = 176; // total duration of the long video in seconds
const durationPerVideo = totalDuration / numberOfVideos;

// Create short videos
for (let i = 0; i < numberOfVideos; i++) {
  const outputVideoPath = path.join(outputDir, `video_${i + 1}.mov`);

  const startTime = i * durationPerVideo;
  const endTime = startTime + durationPerVideo;

  // Create a command
  const command = ffmpeg().input(inputVideoPath)
    .setStartTime(startTime)
    .setDuration(durationPerVideo)
    .outputOptions('-b:v', '512k')
    .saveToFile(outputVideoPath)
    .on('progress', (progress) => {
        if (progress.percent) {
        console.log(`Processing: ${Math.floor(progress.percent)}% done`);
        }
    })// The callback that is run when FFmpeg is finished
    .on('end', () => {
        console.log('FFmpeg has finished.');
    })
    // The callback that is run when FFmpeg encountered an error
    .on('error', (error) => {
        console.error(error);
    });
}

const { createFFmpeg, fetchFile } = FFmpeg
const ffmpeg = createFFmpeg({ log: true, progress: p => displayProgress(p) });

const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const video = document.getElementById('video');
let stream;
let mediaRecorder;
const chunks = [];
const displayMediaOptions = {
    video: {
        cursor: "always"
    },
    audio: true
};

const startCapture = async () => {
    try {
        stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        video.srcObject = stream;
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
    } catch (err) {
        console.error("Error: " + err);
    }
}

const stopCapture = () => {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
    saveCapture()
}

const saveCapture = () => {
    mediaRecorder.stop();
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        stream.getVideoTracks()[0].stop();
        const capture = await encodeCapture(blob);
        const captureUrl = new Blob([capture.buffer], { type: 'video/mp4' });

        if (window.navigator.msSaveOrOpenBlob) { //IEをサポート
            window.navigator.msSaveBlob(capture, filename);
        } else {
            const elem = document.createElement('a');
            elem.href = window.URL.createObjectURL(captureUrl);
            elem.download = 'キャプチャー';
            elem.click();
        }
    }
}

const encodeCapture = async (blob) => {
    const videoName = 'test.mp4';

    await ffmpeg.load();
    ffmpeg.FS('writeFile', videoName, await fetchFile(blob));
    await ffmpeg.run('-i', videoName, 'output.mp4');
    const data = ffmpeg.FS('readFile', 'output.mp4')

    ffmpeg.FS('unlink', videoName)
    ffmpeg.FS('unlink', 'output.mp4')
    return data
}

const displayProgress = (progress) => {
    console.log(progress)
    stopButton.innerText = Math.round(100 * progress.ratio) + '%'
}

startButton.addEventListener('click', startCapture);
stopButton.addEventListener('click', stopCapture);
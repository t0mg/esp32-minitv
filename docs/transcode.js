import { FFmpeg } from './ffmpeg/index.js';
import { toBlobURL } from './ffmpeg-util/index.js';

document.addEventListener('DOMContentLoaded', () => {
  const transcodeVideoFile = document.getElementById('transcodeVideoFile');
  const transcodeButton = document.getElementById('transcodeButton');
  const cancelButton = document.getElementById('cancelButton');
  const transcodeProgress = document.getElementById('transcodeProgress');
  const transcodeStatus = document.getElementById('transcodeStatus');
  const downloadLink = document.getElementById('downloadLink');

  let ffmpeg = null;
  let detectedFps = 30; // Default fallback

  const loadFFmpeg = async () => {
    transcodeStatus.textContent = 'Loading ffmpeg-core.js...';
    // Reset UI state
    transcodeButton.disabled = true;
    cancelButton.disabled = true;
    cancelButton.style.display = 'none';

    ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
      console.log(message);
      const fpsMatch = message.match(/,\s*(\d+(?:\.\d+)?)\s*fps/);
      if (fpsMatch && fpsMatch[1]) {
        detectedFps = parseFloat(fpsMatch[1]);
      }
    });

    ffmpeg.on('progress', ({ progress, time }) => {
      // Ensure progress is between 0 and 100
      transcodeProgress.value = Math.min(Math.max(progress * 100, 0), 100);
    });

    const coreURL = await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js', 'text/javascript');
    const wasmURL = await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm', 'application/wasm');

    await ffmpeg.load({ coreURL, wasmURL });

    transcodeStatus.textContent = 'FFmpeg loaded. Ready.';
    transcodeButton.disabled = false;
  };

  // 2. Transcode Logic
  transcodeButton.addEventListener('click', async () => {
    if (!transcodeVideoFile.files || transcodeVideoFile.files.length === 0) {
      alert('Please select a video file first.');
      return;
    }

    const file = transcodeVideoFile.files[0];

    // UI Updates
    transcodeButton.disabled = true;
    transcodeVideoFile.disabled = true;
    cancelButton.disabled = false;
    cancelButton.style.display = 'inline';
    transcodeProgress.style.display = 'block';
    transcodeProgress.value = 0;
    downloadLink.style.display = 'none';

    try {
      transcodeStatus.textContent = '\nDetecting source framerate...';
      await ffmpeg.writeFile('input.mp4', new Uint8Array(await file.arrayBuffer()));

      // FIX 1: Use exec with array, and ignore the inevitable error
      try {
        await ffmpeg.exec(['-i', 'input.mp4']);
      } catch (e) {
        // We expect this to fail because there is no output file.
        // We only ran this to trigger the 'log' event to find FPS.
        console.log('Probe finished (expected error ignored)');
      }

      const targetFps = Math.min(detectedFps, 25);
      transcodeStatus.textContent += `\nFound ${detectedFps} FPS. Output will target ${targetFps} FPS.`;
      transcodeStatus.textContent += `\nTranscoding...`;

      const command = [
        '-y',
        '-i', 'input.mp4',
        '-an',
        '-c:v', 'mjpeg',
        '-q:v', '10',
        '-vf', `scale=-1:240:flags=lanczos,crop=288:240:(in_w-288)/2:0,fps=${targetFps}`,
        'out.avi'
      ];

      await ffmpeg.exec(command);

      // Success handling
      const data = await ffmpeg.readFile('out.avi');
      const blob = new Blob([data.buffer], { type: 'video/avi' });
      const url = URL.createObjectURL(blob);

      downloadLink.href = url;
      downloadLink.download = 'out.avi';
      downloadLink.style.display = 'block';
      transcodeStatus.textContent += '\nTranscoding complete!';
    } catch (err) {
      console.error(err);
      transcodeStatus.textContent += '\nError during transcoding (check console).';
    } finally {
      // Cleanup UI
      transcodeVideoFile.disabled = false;
      transcodeButton.disabled = false;
      cancelButton.disabled = true;
      cancelButton.style.display = 'none';
      transcodeProgress.style.display = 'none';
    }
  });

  // 3. Cancel/Interrupt Logic
  cancelButton.addEventListener('click', () => {
    if (ffmpeg) {
      ffmpeg.terminate(); // Kills the worker
      transcodeStatus.textContent += '\nTranscoding cancelled. Reloading FFmpeg...';

      // Clean up UI immediately
      transcodeProgress.style.display = 'none';
      transcodeVideoFile.disabled = false;
      cancelButton.disabled = true;
      cancelButton.style.display = 'none';

      // We must reload ffmpeg to use it again
      loadFFmpeg();
    }
  });

  loadFFmpeg();
});
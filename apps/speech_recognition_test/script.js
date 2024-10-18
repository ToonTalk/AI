document.getElementById('startButton').addEventListener('click', async () => {
  const transcriptionTextArea = document.getElementById('transcription');

  // Check if WebGPU is supported
  if (!navigator.gpu) {
    transcriptionTextArea.value = 'WebGPU is not supported on this browser.';
    return;
  }

  // Initialize the Whisper model from transformers.js
  const { WhisperForSpeechRecognition, AutoProcessor } = transformers;
  const processor = await AutoProcessor.from_pretrained('openai/whisper-base');
  const model = await WhisperForSpeechRecognition.from_pretrained('openai/whisper-base');

  // Set up WebGPU
  const device = await navigator.gpu.requestDevice();

  // Function to handle audio stream and transcription
  const handleAudioStream = async (stream) => {
    const audioContext = new AudioContext();
    const mediaStreamSource = audioContext.createMediaStreamSource(stream);
    const processorNode = audioContext.createScriptProcessor(4096, 1, 1);

    processorNode.onaudioprocess = async (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      const inputTensor = new Float32Array(inputData);

      const inputs = processor(inputTensor, { return_tensors: 'tf' });
      const output = await model.generate(inputs.input_features, {
        max_length: 100,
        device: device,
      });

      const transcription = processor.decode(output.sequences[0]);
      transcriptionTextArea.value = transcription;
    };

    mediaStreamSource.connect(processorNode);
    processorNode.connect(audioContext.destination);
  };

  // Request microphone access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    handleAudioStream(stream);
  } catch (error) {
    transcriptionTextArea.value = 'Error accessing microphone: ' + error.message;
  }
});

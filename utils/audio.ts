// Utility to decode raw PCM data from Gemini TTS
// Based on Gemini API guidance for raw PCM processing

let audioContext: AudioContext | null = null;

export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000, // Gemini TTS often defaults to 24k
    });
  }
  return audioContext;
};

export const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const playPCMData = async (base64Data: string): Promise<void> => {
  const ctx = getAudioContext();
  
  // Resume context if suspended (browser policy)
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const bytes = decodeBase64(base64Data);
  
  // Convert 16-bit PCM to Float32
  // Gemini returns 16-bit Little Endian PCM
  const dataInt16 = new Int16Array(bytes.buffer);
  const numChannels = 1; // TTS is mono
  const frameCount = dataInt16.length;
  
  const buffer = ctx.createBuffer(numChannels, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  
  return new Promise((resolve) => {
    source.onended = () => resolve();
    source.start();
  });
};

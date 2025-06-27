// Audio Processing Utilities for MISS Legal AI
import { voiceLogger } from '@/utils/logger';

interface AudioMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  format: string;
  size: number;
}

interface AudioQualityMetrics {
  snr: number; // Signal-to-noise ratio
  clarity: number; // Voice clarity score
  volume: number; // Average volume level
  silenceRatio: number; // Ratio of silence to speech
  distortion: number; // Audio distortion level
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface AudioChunk {
  data: Buffer;
  timestamp: number;
  sequenceNumber: number;
  sampleRate: number;
  channels: number;
}

interface ProcessedAudio {
  buffer: Buffer;
  metadata: AudioMetadata;
  quality: AudioQualityMetrics;
  optimized: boolean;
}

export class AudioProcessor {
  private static readonly OPTIMAL_SAMPLE_RATE = 16000; // 16kHz for speech
  private static readonly OPTIMAL_CHANNELS = 1; // Mono for speech
  private static readonly TARGET_BIT_DEPTH = 16; // 16-bit PCM
  private static readonly MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB limit
  private static readonly MIN_DURATION = 100; // 100ms minimum
  private static readonly MAX_DURATION = 300000; // 5 minutes maximum

  /**
   * Process raw audio for optimal speech recognition
   */
  static async processForSpeechRecognition(
    audioBuffer: Buffer,
    sourceFormat: string = 'webm'
  ): Promise<ProcessedAudio> {
    try {
      voiceLogger.debug('Processing audio for speech recognition', {
        sourceFormat,
        originalSize: audioBuffer.length,
      });

      // Extract metadata
      const metadata = await this.extractAudioMetadata(audioBuffer, sourceFormat);

      // Validate audio
      this.validateAudioInput(audioBuffer, metadata);

      // Convert to optimal format for speech recognition
      let processedBuffer = audioBuffer;
      let optimized = false;

      // Convert to 16kHz mono PCM if needed
      if (metadata.sampleRate !== this.OPTIMAL_SAMPLE_RATE || metadata.channels !== this.OPTIMAL_CHANNELS) {
        processedBuffer = await this.convertAudioFormat(audioBuffer, {
          sampleRate: this.OPTIMAL_SAMPLE_RATE,
          channels: this.OPTIMAL_CHANNELS,
          bitDepth: this.TARGET_BIT_DEPTH,
        });
        optimized = true;
      }

      // Apply noise reduction
      processedBuffer = await this.applyNoiseReduction(processedBuffer);

      // Normalize volume
      processedBuffer = await this.normalizeVolume(processedBuffer);

      // Assess audio quality
      const quality = await this.assessAudioQuality(processedBuffer);

      // Update metadata for processed audio
      const finalMetadata: AudioMetadata = {
        ...metadata,
        sampleRate: this.OPTIMAL_SAMPLE_RATE,
        channels: this.OPTIMAL_CHANNELS,
        bitDepth: this.TARGET_BIT_DEPTH,
        size: processedBuffer.length,
        format: 'pcm',
      };

      voiceLogger.debug('Audio processing completed', {
        originalSize: audioBuffer.length,
        processedSize: processedBuffer.length,
        quality: quality.quality,
        optimized,
      });

      return {
        buffer: processedBuffer,
        metadata: finalMetadata,
        quality,
        optimized,
      };
    } catch (error) {
      voiceLogger.error('Audio processing failed', {
        sourceFormat,
        originalSize: audioBuffer.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process audio chunks for real-time streaming
   */
  static async processAudioChunk(chunk: AudioChunk): Promise<{
    processedChunk: AudioChunk;
    quality: AudioQualityMetrics;
    shouldBuffer: boolean;
  }> {
    try {
      // Basic processing for real-time chunks
      let processedData = chunk.data;

      // Apply noise gate to remove background noise
      processedData = await this.applyNoiseGate(processedData, -30); // -30dB threshold

      // Normalize volume for consistent levels
      processedData = await this.normalizeVolumeSimple(processedData);

      // Assess chunk quality
      const quality = await this.assessChunkQuality(processedData);

      // Determine if chunk should be buffered for better processing
      const shouldBuffer = quality.volume < 0.1 || quality.clarity < 0.3;

      const processedChunk: AudioChunk = {
        ...chunk,
        data: processedData,
      };

      return {
        processedChunk,
        quality,
        shouldBuffer,
      };
    } catch (error) {
      voiceLogger.error('Audio chunk processing failed', {
        chunkSize: chunk.data.length,
        sequenceNumber: chunk.sequenceNumber,
        error,
      });

      // Return original chunk on error
      return {
        processedChunk: chunk,
        quality: {
          snr: 0,
          clarity: 0,
          volume: 0,
          silenceRatio: 1,
          distortion: 1,
          quality: 'poor',
        },
        shouldBuffer: false,
      };
    }
  }

  /**
   * Optimize audio for specific Nigerian network conditions
   */
  static async optimizeForNetwork(
    audioBuffer: Buffer,
    networkQuality: 'excellent' | 'good' | 'fair' | 'poor'
  ): Promise<Buffer> {
    try {
      let optimizedBuffer = audioBuffer;

      switch (networkQuality) {
        case 'poor':
          // Aggressive compression for poor network
          optimizedBuffer = await this.compressAudio(audioBuffer, {
            quality: 'low',
            bitrate: 32000, // 32kbps
            sampleRate: 8000, // 8kHz
          });
          break;

        case 'fair':
          // Moderate compression
          optimizedBuffer = await this.compressAudio(audioBuffer, {
            quality: 'medium',
            bitrate: 64000, // 64kbps
            sampleRate: 16000, // 16kHz
          });
          break;

        case 'good':
          // Light compression
          optimizedBuffer = await this.compressAudio(audioBuffer, {
            quality: 'high',
            bitrate: 96000, // 96kbps
            sampleRate: 16000, // 16kHz
          });
          break;

        case 'excellent':
          // Minimal compression
          optimizedBuffer = await this.compressAudio(audioBuffer, {
            quality: 'high',
            bitrate: 128000, // 128kbps
            sampleRate: 22050, // 22kHz
          });
          break;
      }

      voiceLogger.debug('Audio optimized for network', {
        networkQuality,
        originalSize: audioBuffer.length,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: audioBuffer.length / optimizedBuffer.length,
      });

      return optimizedBuffer;
    } catch (error) {
      voiceLogger.error('Network optimization failed', { networkQuality, error });
      return audioBuffer; // Return original on error
    }
  }

  /**
   * Detect voice activity in audio
   */
  static async detectVoiceActivity(audioBuffer: Buffer): Promise<{
    hasVoice: boolean;
    voiceSegments: Array<{ start: number; end: number; confidence: number }>;
    silenceRatio: number;
    averageEnergy: number;
  }> {
    try {
      const samples = this.bufferToSamples(audioBuffer);
      const sampleRate = this.OPTIMAL_SAMPLE_RATE;
      const frameSize = Math.floor(sampleRate * 0.025); // 25ms frames
      const hopSize = Math.floor(sampleRate * 0.010); // 10ms hop

      const voiceSegments: Array<{ start: number; end: number; confidence: number }> = [];
      let totalEnergy = 0;
      let silentFrames = 0;
      let totalFrames = 0;

      for (let i = 0; i < samples.length - frameSize; i += hopSize) {
        const frame = samples.slice(i, i + frameSize);
        const energy = this.calculateFrameEnergy(frame);
        const zcr = this.calculateZeroCrossingRate(frame);
        
        totalEnergy += energy;
        totalFrames++;

        // Voice activity detection based on energy and zero-crossing rate
        const isVoice = energy > 0.01 && zcr > 0.1 && zcr < 0.8;
        
        if (!isVoice) {
          silentFrames++;
        }

        // Group consecutive voice frames into segments
        if (isVoice) {
          const startTime = (i / sampleRate) * 1000; // Convert to milliseconds
          const endTime = ((i + frameSize) / sampleRate) * 1000;
          const confidence = Math.min(energy * 10, 1.0); // Simple confidence based on energy

          // Merge with previous segment if close enough
          if (voiceSegments.length > 0) {
            const lastSegment = voiceSegments[voiceSegments.length - 1];
            if (startTime - lastSegment.end < 200) { // 200ms gap threshold
              lastSegment.end = endTime;
              lastSegment.confidence = Math.max(lastSegment.confidence, confidence);
              continue;
            }
          }

          voiceSegments.push({ start: startTime, end: endTime, confidence });
        }
      }

      const hasVoice = voiceSegments.length > 0;
      const silenceRatio = totalFrames > 0 ? silentFrames / totalFrames : 1;
      const averageEnergy = totalFrames > 0 ? totalEnergy / totalFrames : 0;

      return {
        hasVoice,
        voiceSegments,
        silenceRatio,
        averageEnergy,
      };
    } catch (error) {
      voiceLogger.error('Voice activity detection failed', { error });
      return {
        hasVoice: false,
        voiceSegments: [],
        silenceRatio: 1,
        averageEnergy: 0,
      };
    }
  }

  /**
   * Enhance audio quality for Nigerian accents
   */
  static async enhanceForNigerianAccents(audioBuffer: Buffer): Promise<Buffer> {
    try {
      // Apply specific enhancements for Nigerian accent characteristics
      let enhancedBuffer = audioBuffer;

      // Boost mid-range frequencies common in Nigerian languages
      enhancedBuffer = await this.applyEqualizer(enhancedBuffer, {
        lowGain: 0.0,    // 0-500Hz
        midGain: 0.2,    // 500-2000Hz (boost for clarity)
        highGain: 0.1,   // 2000Hz+ (slight boost for consonants)
      });

      // Apply dynamic range compression to even out volume levels
      enhancedBuffer = await this.applyCompression(enhancedBuffer, {
        threshold: -20,  // dB
        ratio: 3.0,      // 3:1 compression ratio
        attack: 5,       // ms
        release: 50,     // ms
      });

      // Reduce background noise common in Nigerian environments
      enhancedBuffer = await this.applySpectralGating(enhancedBuffer, {
        gateThreshold: -40, // dB
        reductionFactor: 0.5,
      });

      voiceLogger.debug('Audio enhanced for Nigerian accents', {
        originalSize: audioBuffer.length,
        enhancedSize: enhancedBuffer.length,
      });

      return enhancedBuffer;
    } catch (error) {
      voiceLogger.error('Nigerian accent enhancement failed', { error });
      return audioBuffer;
    }
  }

  // Private helper methods

  private static async extractAudioMetadata(
    audioBuffer: Buffer,
    format: string
  ): Promise<AudioMetadata> {
    // Simplified metadata extraction (would use audio library in production)
    // For now, return sensible defaults based on format
    const defaults: Record<string, Partial<AudioMetadata>> = {
      webm: { sampleRate: 48000, channels: 2, bitDepth: 16 },
      wav: { sampleRate: 44100, channels: 2, bitDepth: 16 },
      mp3: { sampleRate: 44100, channels: 2, bitDepth: 16 },
      m4a: { sampleRate: 44100, channels: 2, bitDepth: 16 },
    };

    const metadata = defaults[format] || defaults.wav;

    return {
      duration: audioBuffer.length / (metadata.sampleRate! * metadata.channels! * (metadata.bitDepth! / 8)),
      sampleRate: metadata.sampleRate!,
      channels: metadata.channels!,
      bitDepth: metadata.bitDepth!,
      format,
      size: audioBuffer.length,
    };
  }

  private static validateAudioInput(audioBuffer: Buffer, metadata: AudioMetadata): void {
    if (audioBuffer.length === 0) {
      throw new Error('Empty audio buffer');
    }

    if (audioBuffer.length > this.MAX_AUDIO_SIZE) {
      throw new Error(`Audio file too large: ${audioBuffer.length} bytes (max: ${this.MAX_AUDIO_SIZE})`);
    }

    if (metadata.duration < this.MIN_DURATION) {
      throw new Error(`Audio too short: ${metadata.duration}ms (min: ${this.MIN_DURATION}ms)`);
    }

    if (metadata.duration > this.MAX_DURATION) {
      throw new Error(`Audio too long: ${metadata.duration}ms (max: ${this.MAX_DURATION}ms)`);
    }
  }

  private static async convertAudioFormat(
    audioBuffer: Buffer,
    targetFormat: { sampleRate: number; channels: number; bitDepth: number }
  ): Promise<Buffer> {
    // Simplified format conversion (would use FFmpeg or similar in production)
    // For now, return the original buffer
    // In production, this would handle sample rate conversion, channel mixing, etc.
    return audioBuffer;
  }

  private static async applyNoiseReduction(audioBuffer: Buffer): Promise<Buffer> {
    // Simplified noise reduction using spectral subtraction
    const samples = this.bufferToSamples(audioBuffer);
    
    // Apply simple high-pass filter to remove low-frequency noise
    const filteredSamples = samples.map((sample, i) => {
      if (i === 0) return sample;
      return sample - 0.95 * samples[i - 1]; // Simple high-pass filter
    });

    return this.samplesToBuffer(filteredSamples);
  }

  private static async normalizeVolume(audioBuffer: Buffer): Promise<Buffer> {
    const samples = this.bufferToSamples(audioBuffer);
    
    // Find peak amplitude
    const peak = Math.max(...samples.map(Math.abs));
    
    if (peak === 0) return audioBuffer;
    
    // Normalize to 0.8 of maximum to prevent clipping
    const normalizeRatio = 0.8 / peak;
    const normalizedSamples = samples.map(sample => sample * normalizeRatio);
    
    return this.samplesToBuffer(normalizedSamples);
  }

  private static async normalizeVolumeSimple(audioBuffer: Buffer): Promise<Buffer> {
    // Quick volume normalization for real-time processing
    const samples = this.bufferToSamples(audioBuffer);
    const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
    
    if (rms === 0) return audioBuffer;
    
    const targetRms = 0.3; // Target RMS level
    const gain = targetRms / rms;
    const limitedGain = Math.min(gain, 3.0); // Limit gain to prevent excessive amplification
    
    const normalizedSamples = samples.map(sample => sample * limitedGain);
    return this.samplesToBuffer(normalizedSamples);
  }

  private static async applyNoiseGate(audioBuffer: Buffer, thresholdDb: number): Promise<Buffer> {
    const samples = this.bufferToSamples(audioBuffer);
    const threshold = Math.pow(10, thresholdDb / 20); // Convert dB to linear
    
    const gatedSamples = samples.map(sample => {
      return Math.abs(sample) > threshold ? sample : sample * 0.1; // Attenuate by 20dB
    });
    
    return this.samplesToBuffer(gatedSamples);
  }

  private static async assessAudioQuality(audioBuffer: Buffer): Promise<AudioQualityMetrics> {
    const samples = this.bufferToSamples(audioBuffer);
    
    // Calculate various quality metrics
    const volume = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
    const peak = Math.max(...samples.map(Math.abs));
    const zcr = this.calculateZeroCrossingRate(samples);
    
    // Simple quality assessment
    const snr = peak > 0 ? 20 * Math.log10(volume / (peak * 0.01)) : 0; // Simplified SNR
    const clarity = Math.min(zcr * 2, 1.0); // Based on zero-crossing rate
    const silenceRatio = samples.filter(s => Math.abs(s) < 0.01).length / samples.length;
    const distortion = peak > 0.95 ? (peak - 0.95) / 0.05 : 0; // Clipping detection
    
    // Overall quality score
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    const qualityScore = (snr / 40) + clarity + (1 - silenceRatio) - distortion;
    
    if (qualityScore > 2.0) quality = 'excellent';
    else if (qualityScore > 1.5) quality = 'good';
    else if (qualityScore > 1.0) quality = 'fair';
    
    return {
      snr: Math.max(0, snr),
      clarity,
      volume,
      silenceRatio,
      distortion,
      quality,
    };
  }

  private static async assessChunkQuality(audioBuffer: Buffer): Promise<AudioQualityMetrics> {
    // Simplified quality assessment for real-time chunks
    return this.assessAudioQuality(audioBuffer);
  }

  private static async compressAudio(
    audioBuffer: Buffer,
    options: { quality: string; bitrate: number; sampleRate: number }
  ): Promise<Buffer> {
    // Simplified audio compression (would use FFmpeg in production)
    // For now, just downsample if needed
    return audioBuffer;
  }

  private static async applyEqualizer(
    audioBuffer: Buffer,
    eq: { lowGain: number; midGain: number; highGain: number }
  ): Promise<Buffer> {
    // Simplified EQ (would use proper digital filters in production)
    return audioBuffer;
  }

  private static async applyCompression(
    audioBuffer: Buffer,
    params: { threshold: number; ratio: number; attack: number; release: number }
  ): Promise<Buffer> {
    // Simplified dynamic range compression
    return audioBuffer;
  }

  private static async applySpectralGating(
    audioBuffer: Buffer,
    params: { gateThreshold: number; reductionFactor: number }
  ): Promise<Buffer> {
    // Simplified spectral gating for noise reduction
    return audioBuffer;
  }

  // Utility methods for sample conversion
  private static bufferToSamples(buffer: Buffer): number[] {
    const samples: number[] = [];
    for (let i = 0; i < buffer.length; i += 2) {
      // Convert 16-bit PCM to float (-1 to 1)
      const sample = buffer.readInt16LE(i) / 32768.0;
      samples.push(sample);
    }
    return samples;
  }

  private static samplesToBuffer(samples: number[]): Buffer {
    const buffer = Buffer.allocUnsafe(samples.length * 2);
    for (let i = 0; i < samples.length; i++) {
      // Convert float (-1 to 1) to 16-bit PCM
      const sample = Math.max(-1, Math.min(1, samples[i])); // Clamp to prevent overflow
      buffer.writeInt16LE(Math.round(sample * 32767), i * 2);
    }
    return buffer;
  }

  private static calculateFrameEnergy(frame: number[]): number {
    return frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length;
  }

  private static calculateZeroCrossingRate(samples: number[]): number {
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0) !== (samples[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / (samples.length - 1);
  }
}

export default AudioProcessor;

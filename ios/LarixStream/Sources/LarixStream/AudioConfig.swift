import AVFoundation

/**
    Audio encoding parameters
 */
public struct AudioConfig {
    /// Audio sample rate; use 0 for auto
    public var sampleRate: Double
    /// Audio channels: 1 - mono, 2 - stereo
    public var channelCount: Int
    /// Bitrate for encoded audio; 0 for auto
    public var bitrate: Int
    /// Preferred audio input; use default input when unassigned
    public var preferredInput: AVAudioSession.Port?
    
    public init(sampleRate: Double, channelCount: Int, bitrate: Int) {
        self.sampleRate = sampleRate
        self.channelCount = channelCount
        self.bitrate = bitrate
    }
    
}

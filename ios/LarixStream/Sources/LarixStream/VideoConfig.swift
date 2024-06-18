import AVFoundation
import VideoToolbox
import LarixCore

public struct VideoConfig {
    public enum MultiCamMode: String {
        case off = "off"
        case pip = "pip"
        case sideBySide = "sideBySide"
    }
    
    public enum ProcessingMode {
        case disabled
        case coreImage
        case metal
    }
    
    public var cameraID: String
    public var videoSize: CMVideoDimensions
    public var fps: Double // AVFrameRateRange
    public var keyFrameIntervalDuration: Double = 2.0
    public var bitrate: Int
    public var bitrateLimit: Int? = nil
    public var portrait: Bool = false
    public var type: CMVideoCodecType = kCMVideoCodecType_H264
    public var profileLevel: CFString = kVTProfileLevel_H264_Baseline_AutoLevel
    public var processingMode: ProcessingMode = .coreImage
    public var fileWritingMode: FileWritingMode = .sharedSession
    
    
    public init(cameraID: String, videoSize: CMVideoDimensions, fps: Double,
                keyFrameIntervalDuration: Double,
                bitrate: Int, bitrateLimit: Int? = nil,
                portrait: Bool,
                type: CMVideoCodecType = kCMVideoCodecType_H264,
                profileLevel: CFString = kVTProfileLevel_H264_Baseline_AutoLevel,
                processingMode: ProcessingMode = .coreImage,
                fileWritingMode: FileWritingMode = .sharedSession) {
        self.cameraID = cameraID
        self.videoSize = videoSize
        self.fps = fps
        self.keyFrameIntervalDuration = keyFrameIntervalDuration
        self.bitrate = bitrate
        self.bitrateLimit = bitrateLimit
        self.portrait = portrait
        self.type = type
        self.profileLevel = profileLevel
        self.processingMode = processingMode
        self.fileWritingMode = fileWritingMode
    }
    
    public var description: String {
        let nf = NumberFormatter()
        nf.numberStyle = .none
        
        let codecDisplayName = type == kCMVideoCodecType_HEVC ? "HEVC" : "H.264"
        let width = String(videoSize.width)
        let height = String(videoSize.height)
        
        let profile = profileLevel as String
        let profileArr = profile.components(separatedBy: "_")
        let profileDisplayName = profileArr.count > 2 ? profileArr[1] : ""
        
        let message = String.localizedStringWithFormat(NSLocalizedString("%@ (%@), %@x%@", comment: ""), codecDisplayName, profileDisplayName, width, height)
        
        return message
    }
}

import Foundation
import CoreImage

public class ImageLayer: Comparable {
    public var active: Bool
    public var name: String
    public var remoteUrl: URL?
    public var localUrl: URL?
    public var rect: CGRect = CGRect()
    public var center: CGPoint = CGPoint()
    public var scale: CGFloat = 0.0
    public var zIndex: Int32 = 0
    public var image: CIImage?
    public var cacheTag: String? //If assigned, will keep image by tag in memory cache
    
    public init(name: String, remoteUrl: URL?) {
        self.name = name
        self.remoteUrl = remoteUrl
        self.active = true
    }
    
    public static func < (a: ImageLayer, b: ImageLayer) -> Bool {
        return a.zIndex < b.zIndex
    }

    public static func == (a: ImageLayer, b: ImageLayer) -> Bool {
        return a.zIndex == b.zIndex
    }

}

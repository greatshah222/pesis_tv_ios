import Foundation
import CoreImage
import UIKit
import LarixSupport

public enum ImageLayerError: Error {
    case badUrl
    case imageLoadFailed
    case urlSessionError(Error)
    case httpError(Int)
    case fileTooLarge(Int64)
    case imageTooLarge(Int, Int)
    case unsupportedType(String)
}

public protocol CompositeImageLayerDelegate {
    func onImageLoadComplete()
    func onImageLoaded(name: String)
    func onLoadError(name: String, error: ImageLayerError)
    func onDownloadFinish(layer: ImageLayer, location: URL, suggestedFilename: String) -> URL?
}

public extension CompositeImageLayerDelegate {
    func onImageLoaded(name: String) {
        
    }
    
    func onLoadError(name: String, error: ImageLayerError) {
        
    }
    
    func onDownloadFinish(layer: ImageLayer, location: URL, suggestedFilename: String) -> URL? {
        return nil
    }
}

public class CompositeImageLayer: NSObject, URLSessionDownloadDelegate {
    let maxAllowedDowloadSize:Int64 = 10_000_000
    let maxAllowedImageResolution:Int64 = 10_000_000

    public var delegate: CompositeImageLayerDelegate?
    public var outputImage: CIImage?
    public var size: CGSize = CGSize(width: 1920, height: 1080)
    
    private var layers: [ImageLayer] = []
    private var imageCache: [String: CIImage] = [:]

    private var urlSession: URLSession?
    static private var operationQueue: OperationQueue?
    
    private var pendingImageLoad: Int = 0
    private var downloadTasks: [Int: ImageLayer] = [:]
    private var running = true

    private func initQueue() {
        if Self.operationQueue != nil {
            return
        }
        let newQueue = OperationQueue()
        newQueue.name = "imageDownloader"
        Self.operationQueue = newQueue
    }
    
    public func loadList(_ layerList: [ImageLayer]) {
        initQueue()
        pendingImageLoad = layerList.count
        if layerList.isEmpty {
            clearImages()
        }
        layers.removeAll()
        for layer in layerList {
            if let id = layer.cacheTag, let image = imageCache[id] {
                layer.image = image
            }
            var local = layer.image != nil
            if !local, let localUrl = layer.localUrl, FileManager.default.fileExists(atPath: localUrl.path) {
                local = true
            }
            if local {
                openImageAsync(layer: layer)
            } else if let queue = Self.operationQueue, let url = layer.remoteUrl, url.scheme?.starts(with: "http") == true {
                if urlSession == nil {
                    let configuration = URLSessionConfiguration.default
                    urlSession = URLSession(configuration: configuration, delegate: self, delegateQueue: queue)
                }
                
                if let task = urlSession?.downloadTask(with: url) {
                    let taskId = task.taskIdentifier
                    downloadTasks[taskId] = layer
                    task.resume()
                }
            } else {
                delegate?.onLoadError(name: layer.name, error: .badUrl)
                markImageLoaded()
            }
                
            layers.append(layer)
        }
        if (layerList.isEmpty) {
            drawImages()
        }
    }
    
    public func invalidate() {
        LogInfo("invalidate statr")
        running = false
        outputImage = nil
        urlSession?.invalidateAndCancel()
        Self.operationQueue?.cancelAllOperations()
        imageCache.removeAll()
        layers.removeAll()
        LogInfo("invalidate end")
    }
    
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        let taskId = downloadTask.taskIdentifier
        guard let layer = downloadTasks[taskId] else {
            NSLog("Something wrong been downloaded")
            return
        }
        var httpCode: Int = 200
        if let httpRes = downloadTask.response as? HTTPURLResponse {
            httpCode = httpRes.statusCode
        }
        if httpCode >= 400 {
            LarixLogger.put(message: "File downloading status \(httpCode)", severity: .error, priority: .med)
            delegate?.onLoadError(name: layer.name, error: .httpError(httpCode))
            markImageLoaded()
        } else {
            let fileName = downloadTask.response?.suggestedFilename ?? UUID().uuidString
            if let dest = delegate?.onDownloadFinish(layer: layer, location: location, suggestedFilename: fileName) {
                layer.localUrl = dest
                openImageAsync(layer: layer)
            } else {
                let renameTo = location.deletingLastPathComponent().appendingPathComponent(fileName)
                do {
                    try FileManager.default.moveItem(at: location, to: renameTo)
                    layer.localUrl = renameTo
                    openImageAsync(layer: layer, isTempFile: true)
                } catch {
                    delegate?.onLoadError(name: layer.name, error: .imageLoadFailed)
                    markImageLoaded()
                }
            }
        }
        downloadTasks.removeValue(forKey: taskId)
    }
    
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        let taskId = downloadTask.taskIdentifier
        guard let layer = downloadTasks[taskId] else {
            return
        }

        let totalSize: Int64
        if totalBytesExpectedToWrite == NSURLSessionTransferSizeUnknown {
            totalSize = bytesWritten
        } else {
            totalSize = totalBytesExpectedToWrite
        }
        var error: ImageLayerError?

        if totalSize > maxAllowedDowloadSize {
            error = .fileTooLarge(totalSize)
        } else if let mimeType = downloadTask.response?.mimeType {
            if !mimeType.starts(with: "image/") {
                error = .unsupportedType(mimeType)
            }
        }
        if let message = error {
            downloadTask.cancel()
            downloadTasks.removeValue(forKey: taskId)
            delegate?.onLoadError(name: layer.name, error: message)
            markImageLoaded()
        }
    }
    
    public func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            let taskId = task.taskIdentifier
            guard let layer = downloadTasks[taskId] else {
                return
            }
            let name = layer.name
            LarixLogger.put(message: "Request of \(name) completed with error: \(error.localizedDescription)", severity: .error, priority: .med)
            delegate?.onLoadError(name: name, error: .urlSessionError(error))
            markImageLoaded()
            downloadTasks.removeValue(forKey: taskId)

        }
    }

    private func openImageAsync(layer: ImageLayer, isTempFile: Bool = false) {
        guard let queue = Self.operationQueue else {
            LogError("No overlay loading queue")
            self.markImageLoaded()
            return

        }
        let id = layer.cacheTag ?? "(null)"
        LogInfo("openImageAsync \(id)")

        queue.addOperation { [weak self] in
            if let image = self?.openImage(layer: layer, isTempFile: isTempFile) {
                layer.image = image
                layer.rect = self?.computeRect(layer: layer) ?? CGRect()
                self?.delegate?.onImageLoaded(name: layer.name)
            }
            self?.markImageLoaded()
        }
    }
    
    private func openImage(layer: ImageLayer, isTempFile: Bool = false) -> CIImage? {
        if layer.image != nil {
            return layer.image
        }
        var image: CIImage? = nil
        if let url = layer.localUrl {
           image = CIImage(contentsOf: url)
        }
        if image == nil || image?.extent.isEmpty != false {
            self.delegate?.onLoadError(name: layer.name, error: .imageLoadFailed)
            image = nil
        }

        if isTempFile, let path = layer.localUrl {
            try? FileManager.default.removeItem(at: path)
        }
        

        return image
    }
    
    private func computeRect(layer: ImageLayer) -> CGRect {
        if layer.rect.width > 0 && layer.rect.height > 0 {
            return layer.rect
        }
        guard let image = layer.image else {
            return CGRect.zero
        }
        let imageSize = image.extent.size
        var w = imageSize.width
        var h = imageSize.height
        let canvasSize = self.size
        let canvasAspect = canvasSize.width / canvasSize.height
        if layer.scale != 0 {
            let fullW: CGFloat
            let fullH: CGFloat
            if canvasAspect > w / h {
                fullW = canvasSize.width
                fullH = canvasSize.width * h / w
            } else {
                fullW = canvasSize.height * w / h
                fullH = canvasSize.height
            }
            w = fullW * layer.scale
            h = fullH * layer.scale
        }
        let xPadding = canvasSize.width - w
        let yPadding = canvasSize.height - h
        let xPos = layer.center.x * xPadding
        let yPos = layer.center.y * yPadding
        return CGRect(x: xPos, y: yPos, width: w, height: h)
    }
    
    private func markImageLoaded() {
        //LogInfo("markImageLoaded: \(pendingImageLoad) left")
        if pendingImageLoad <= 0 {
            return
        }
        pendingImageLoad -= 1
        if pendingImageLoad == 0 {
            drawImages()
        }
    }
    
    
    func clearImages() {
        outputImage = nil
    }
    
    func drawImages() {
        if !running {
            return
        }
        UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
        let orderedLayers = layers.sorted()
        var updated = false
        for layer in orderedLayers where layer.active {
            if let image = layer.image {
                if let id = layer.cacheTag, imageCache[id] == nil {
                   imageCache[id] = image
                }

                let uiImage = UIImage(ciImage: image)
                uiImage.draw(in: layer.rect)
                updated = true
            }
        }
        
        if updated,
           let uiImage = UIGraphicsGetImageFromCurrentImageContext(),
           let ciImage = CIImage(image: uiImage) {
            outputImage = ciImage
        } else {
            outputImage = nil
        }
        UIGraphicsEndImageContext()
        delegate?.onImageLoadComplete()
    }

    
}

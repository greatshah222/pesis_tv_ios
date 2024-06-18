import Foundation
import UIKit
import AVFoundation

public class PreviewLayer: UIView {
    public var fillMode: AVLayerVideoGravity = .resizeAspectFill {
        didSet {
            updateFillMode()
        }
    }
    
    public var videoOrientation: AVCaptureVideoOrientation = .portrait

    internal var parent: UIView

    public init(parent: UIView) {
        let rect = parent.frame
        self.parent = parent
        super.init(frame: rect)
        parent.insertSubview(self, at: 0)
        addConstraints()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    internal func addConstraints() {
        var constraints: [NSLayoutConstraint] = []
        constraints.append(topAnchor.constraint(equalTo: parent.topAnchor))
        constraints.append(bottomAnchor.constraint(equalTo: parent.bottomAnchor))
        constraints.append(leadingAnchor.constraint(equalTo: parent.leadingAnchor))
        constraints.append(trailingAnchor.constraint(equalTo: parent.trailingAnchor))
        NSLayoutConstraint.activate(constraints)
     }
    
    public func getFocusTarget(_ touchPoint: CGPoint) -> (CGPoint?, AVCaptureDevice.Position) {
        return (nil, .unspecified)
    }
    
    internal func updateFillMode() {
        setNeedsLayout()
    }

    
}

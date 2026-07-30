#import <React/RCTBridgeModule.h>
#import <stdlib.h>

@interface DevAppRestart : NSObject <RCTBridgeModule>
@end

@implementation DevAppRestart

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(closeApp)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    exit(0);
  });
}

@end

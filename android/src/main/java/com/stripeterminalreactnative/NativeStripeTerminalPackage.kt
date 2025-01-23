package com.stripeterminalreactnative

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class NativeStripeTerminalPackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        if (name == NativeStripeTerminalSpec.NAME) {
            println("request $name")
            return NativeStripeTerminalModule(reactContext);
        } else {
            println("request other $name")
            return null;
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
        mapOf(
            NativeStripeTerminalSpec.NAME to ReactModuleInfo(
                NativeStripeTerminalSpec.NAME,
                NativeStripeTerminalSpec.NAME,
                _canOverrideExistingModule = false,
                _needsEagerInit = false,
                isCxxModule = false,
                isTurboModule = true
            )
        )
    }
}
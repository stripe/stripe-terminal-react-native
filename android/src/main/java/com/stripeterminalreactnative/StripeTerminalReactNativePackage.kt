package com.stripeterminalreactnative

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class StripeTerminalReactNativePackage : TurboReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
//        if (name == NativeStripeTerminalModule.NAME) {
            NativeStripeTerminalModule(reactContext)
//        } else {
//            null
//        }

    override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
        mapOf(
            NativeStripeTerminalModule.NAME to ReactModuleInfo(
                _name = NativeStripeTerminalModule.NAME,
                _className = NativeStripeTerminalModule.NAME,
                _canOverrideExistingModule = true,
                _needsEagerInit = true,
                isCxxModule = false,
                isTurboModule = true
            )
        )
    }
}

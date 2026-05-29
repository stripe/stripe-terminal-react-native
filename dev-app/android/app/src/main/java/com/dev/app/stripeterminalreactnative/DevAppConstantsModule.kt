package com.dev.app.stripeterminalreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

class DevAppConstantsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "DevAppConstants"

    override fun getConstants(): Map<String, Any> = mapOf(
        "readerEnterScaleUpAnimId" to R.anim.reader_enter_scale_up,
        "readerExitFadeOutAnimId" to R.anim.reader_exit_fade_out,
    )
}

package com.stripeterminalreactnative

import android.app.Application
import android.util.Log
import com.facebook.react.bridge.UiThreadUtil
import com.stripe.stripeterminal.TerminalApplicationDelegate

object TerminalApplicationDelegate {

    @JvmStatic
    fun onCreate(application: Application) {
        Log.d("onCreate", application.toString())
        TerminalApplicationDelegate.onCreate(application)
    }
}

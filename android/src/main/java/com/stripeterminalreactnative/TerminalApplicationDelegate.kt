package com.stripeterminalreactnative

import android.app.Application
import com.stripe.stripeterminal.TerminalApplicationDelegate

object TerminalApplicationDelegate {

    @JvmStatic
    fun onCreate(application: Application) {
        TerminalApplicationDelegate.onCreate(application)
    }
}

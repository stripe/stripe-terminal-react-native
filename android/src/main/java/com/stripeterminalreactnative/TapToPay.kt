package com.stripeterminalreactnative

import android.app.Application
import com.stripe.stripeterminal.taptopay.TapToPay as StripeTerminalTapToPay

/**
 *
 * This is the top-level class delegating Stripe Terminal Tap to Pay Android SDK.
 *
 */
class TapToPay internal constructor() {

    companion object {

        /**
         * Return whether or not the current process is the dedicated Tap to Pay process.
         *
         * Tap to Pay operates within a dedicated process, a second instance of your application, to
         * ensure the secure handling of payment data. As a result, the client
         * app's [Application] subclass will be initialized within this process as well. Given that certain operations may be
         * incompatible in this process, this method can be utilized to determine whether the application should skip those
         * operations at all.
         *
         * @return `true` if the current process is the the dedicated Tap to Pay process, and `false` otherwise.
         */
        @JvmStatic
        fun isInTapToPayProcess(): Boolean {
            return StripeTerminalTapToPay.isInTapToPayProcess()
        }
    }
}

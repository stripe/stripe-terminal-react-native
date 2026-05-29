package com.stripeterminalreactnative

import com.stripe.stripeterminal.Terminal
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
class FeatureParityTest {

    private val ignoreList = listOf(
        "setSimulatorConfiguration",
        "getSimulatorConfiguration",
        "setSimulatedOfflineModeConfiguration", // new in 5.5.0, pending RN implementation
        "getSimulatedOfflineModeConfiguration", // new in 5.5.0, pending RN implementation
        "setTerminalListener",
        "setOfflineListener",
        "isInitialized",
        "getInstance",
        "connectExternalChannel",
        "scanBarcode", // new in 5.4.0, pending RN implementation
        "discoverScanners", // new in 5.4.0, pending RN implementation
        "confirmRefund", // been deprecated
        "collectRefundPaymentMethod", // been deprecated
    )

    private val functionMapping = mapOf(
        "listLocations" to "getLocations",
        "init" to "initialize"
    )

    @Test
    fun `basic test all function has implementation`() {
        val rnMethods = StripeTerminalReactNativeModule::class.java.declaredMethods
        val terminalMethods = Terminal::class.java.declaredMethods

        terminalMethods
            .asSequence()
            .map { it.name }
            .filterNot { it.contains("$") }
            .filterNot { ignoreList.contains(it) }
            .map { functionMapping[it] ?: it }
            .forEach { name ->
                assert(rnMethods.any {
                    it.name == name
                }) {
                    "Fail feature parity: $name"
                }
            }
    }
}
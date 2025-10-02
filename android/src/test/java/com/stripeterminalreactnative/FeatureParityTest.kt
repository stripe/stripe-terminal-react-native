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
        "setTerminalListener",
        "setOfflineListener",
        "isInitialized",
        "getInstance",
        "connectExternalChannel"
    )

    private val functionMapping = mapOf(
        "listLocations" to "getLocations",
        "initTerminal" to "initialize"
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
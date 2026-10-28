package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.stripe.stripeterminal.appsondevices.AppsOnDevicesConnectionTokenProvider
import com.stripe.stripeterminal.external.ConnectionTokenProviderForAppsOnDevices
import com.stripe.stripeterminal.external.callable.ConnectionTokenProvider
import io.mockk.mockk
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertSame
import kotlin.test.assertTrue

/**
 * Tests for TokenProviderFactory.
 *
 * These tests verify that the correct token provider is selected based on
 * the useAppsOnDevicesConnectionTokenProvider parameter.
 */
@RunWith(JUnit4::class)
class TokenProviderFactoryTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    @OptIn(ConnectionTokenProviderForAppsOnDevices::class)
    @Test
    fun `createTokenProvider returns AppsOnDevicesConnectionTokenProvider when param is true`() {
        val params = JavaOnlyMap().apply {
            putBoolean("useAppsOnDevicesConnectionTokenProvider", true)
        }

        val defaultProvider = mockk<ConnectionTokenProvider>()
        val result = TokenProviderFactory.createTokenProvider(params, defaultProvider)

        assertTrue(result is AppsOnDevicesConnectionTokenProvider)
    }

    @Test
    fun `createTokenProvider returns default provider when param is false`() {
        val params = JavaOnlyMap().apply {
            putBoolean("useAppsOnDevicesConnectionTokenProvider", false)
        }

        val defaultProvider = mockk<ConnectionTokenProvider>()
        val result = TokenProviderFactory.createTokenProvider(params, defaultProvider)

        assertSame(defaultProvider, result)
    }

    @Test
    fun `createTokenProvider treats null param as false`() {
        val params = JavaOnlyMap().apply {
            putNull("useAppsOnDevicesConnectionTokenProvider")
        }

        val defaultProvider = mockk<ConnectionTokenProvider>()
        val result = TokenProviderFactory.createTokenProvider(params, defaultProvider)

        assertSame(defaultProvider, result)
    }
}

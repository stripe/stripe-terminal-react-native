package com.stripeterminalreactnative.listener

import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripeterminalreactnative.ReactNativeTypeReplacementRule
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
class RNInternetReaderListenerTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    @Test
    fun `should call inner onDisconnect`() {
        val readerDisconnectListener = mockk<ReaderDisconnectListener> {
            every { onDisconnect(any()) } returns Unit
        }
        val listener = RNInternetReaderListener(readerDisconnectListener)
        listener.onDisconnect(DisconnectReason.DISCONNECT_REQUESTED)
        verify(exactly = 1) { readerDisconnectListener.onDisconnect(DisconnectReason.DISCONNECT_REQUESTED) }
    }
}

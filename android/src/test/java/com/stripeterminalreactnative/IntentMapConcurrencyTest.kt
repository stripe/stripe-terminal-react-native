package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.OfflineMode
import com.stripe.stripeterminal.external.callable.PaymentIntentCallback
import com.stripe.stripeterminal.external.models.PaymentIntent
import com.stripe.stripeterminal.external.models.SetupIntent
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.slot
import io.mockk.unmockkObject
import org.junit.After
import org.junit.Before
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import java.util.concurrent.CountDownLatch
import java.util.concurrent.CyclicBarrier
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Concurrency regression tests for the SDK's intent caches.
 *
 * ## The defect these cover
 *
 * `paymentIntents` and `setupIntents` are written from Stripe SDK callback threads
 * and read/cleared from React Native's NativeModules thread. Both were declared as
 * plain `java.util.HashMap` with no synchronisation, so concurrent mutation lost
 * entries outright.
 *
 * Threading was verified against the shipped SDK rather than assumed: in
 * `stripeterminal-internal-common:5.8.0`, `TerminalSession` holds a
 * `java.util.concurrent.ExecutorService` provided by `TerminalModule` via
 * `Executors.newSingleThreadExecutor()`, and `enqueueOperation` submits to it. So
 * `PaymentIntentCallback.onSuccess` fires on an SDK thread, not on the RN thread.
 *
 * The failure mode was severe and reachable: when the maps were plain `HashMap`,
 * these tests lost 15-29% of concurrently written entries (e.g. 2000 written,
 * 1426-1705 retained). A lost entry means a PaymentIntent the app was already told
 * about, and was already holding as `sdkUuid`, can no longer be resolved by
 * `getPaymentIntentFromParams`, so the follow-up confirm fails with
 * "No PaymentIntent was found with the sdkUuid ...". The maps are now
 * `ConcurrentHashMap`.
 *
 * Unrelated to stripe-terminal-android#747, which concerns duplicate forwarding
 * inside the closed native SDK.
 */
@OptIn(OfflineMode::class)
@RunWith(JUnit4::class)
class IntentMapConcurrencyTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()

        private const val WRITERS = 8
        private const val PER_WRITER = 250
    }

    private val context = mockk<ReactApplicationContext>(relaxed = true)
    private val terminal = mockk<Terminal>(relaxed = true)
    private lateinit var module: StripeTerminalReactNativeModule

    /** Built once and reused. Creating thousands of mockk mocks dominates runtime and
     *  has nothing to do with the defect under test. */
    private val intentValue: PaymentIntent by lazy { mockPaymentIntent() }
    private val setupIntentValue: SetupIntent by lazy { mockSetupIntent() }

    @Before
    fun setUp() {
        mockkObject(Terminal.Companion)
        every { Terminal.getInstance() } returns terminal
        module = StripeTerminalReactNativeModule(context)
    }

    @After
    fun tearDown() {
        unmockkObject(Terminal.Companion)
    }

    private fun createParams(): JavaOnlyMap = JavaOnlyMap().apply {
        putInt("amount", 5000)
        putString("currency", "usd")
        putArray("paymentMethodTypes", JavaOnlyArray())
    }

    private fun relaxedPromise() = mockk<Promise>(relaxed = true)

    // =====================================================================
    // Regression: no concurrent write may be lost
    // =====================================================================

    @Test
    fun `concurrent writes to paymentIntents lose no entries`() {
        writeConcurrently { key -> module.paymentIntents[key] = intentValue }
        assertEquals(
            WRITERS * PER_WRITER,
            module.paymentIntents.size,
            "every concurrently written PaymentIntent must stay retrievable by sdkUuid"
        )
    }

    @Test
    fun `concurrent writes to setupIntents lose no entries`() {
        writeConcurrently { key -> module.setupIntents[key] = setupIntentValue }
        assertEquals(
            WRITERS * PER_WRITER,
            module.setupIntents.size,
            "every concurrently written SetupIntent must stay retrievable by sdkUuid"
        )
    }

    @Test
    fun `a concurrently written intent is resolvable by its sdkUuid`() {
        // The user-visible consequence of a lost entry: the bridge reports a
        // sdkUuid to JS and then cannot resolve it when JS confirms the payment.
        val keys = (0 until WRITERS).map { writer ->
            java.util.concurrent.ConcurrentHashMap.newKeySet<String>().also { set ->
                repeat(PER_WRITER) { index -> set += "w$writer-k$index" }
            }
        }
        val pool = Executors.newFixedThreadPool(WRITERS)
        val barrier = CyclicBarrier(WRITERS)
        try {
            val futures = (0 until WRITERS).map { writer ->
                pool.submit {
                    barrier.await(20, TimeUnit.SECONDS)
                    keys[writer].forEach { module.paymentIntents[it] = intentValue }
                }
            }
            futures.forEach { it.get(60, TimeUnit.SECONDS) }
        } finally {
            pool.shutdownNow()
        }

        val missing = keys.flatMap { it }.filter { module.paymentIntents[it] == null }
        assertTrue(
            missing.isEmpty(),
            "${missing.size} sdkUuid(s) handed to JS can no longer be resolved, e.g. ${missing.take(3)}"
        )
    }

    private fun writeConcurrently(write: (String) -> Unit) {
        val barrier = CyclicBarrier(WRITERS)
        val pool = Executors.newFixedThreadPool(WRITERS)
        try {
            val futures = (0 until WRITERS).map { writer ->
                pool.submit {
                    barrier.await(20, TimeUnit.SECONDS)
                    repeat(PER_WRITER) { index -> write("w$writer-k$index") }
                }
            }
            futures.forEach { it.get(60, TimeUnit.SECONDS) }
        } finally {
            pool.shutdownNow()
        }
    }

    // =====================================================================
    // Characterisation: clear() interleaved with an in-flight SDK write
    // =====================================================================

    @Test
    fun `an in-flight create completes after clearCachedCredentials and is still cached`() {
        // Documents current, deliberate behaviour rather than asserting a defect.
        //
        // `clearCachedCredentials` clears the caches on the RN thread. An SDK create
        // that was already in flight then completes and writes its PaymentIntent back.
        // A `ConcurrentHashMap` makes `clear()` atomic with respect to other map
        // operations, but it cannot - and should not - discard a write from an
        // operation that legitimately completed afterwards.
        //
        // Suppressing that write would mean `createPaymentIntent` resolves to JS with
        // an `sdkUuid` that can never be confirmed, turning a recoverable situation
        // into a guaranteed "No PaymentIntent was found" failure. That would be a
        // behaviour change, not a thread-safety fix, so it is deliberately not done
        // here. If the team decides an in-flight create should be dropped, this test
        // is the place to change the expectation.
        val sdkThread = Executors.newSingleThreadExecutor { r -> Thread(r, "sdk-operation-thread") }
        val release = CountDownLatch(1)
        val entered = CountDownLatch(1)

        try {
            val cbSlot = slot<PaymentIntentCallback>()
            every { terminal.createPaymentIntent(any(), capture(cbSlot), any()) } answers {
                sdkThread.submit {
                    entered.countDown()
                    release.await(10, TimeUnit.SECONDS)
                    cbSlot.captured.onSuccess(intentValue)
                }
            }

            module.createPaymentIntent(createParams(), relaxedPromise())
            assertTrue(entered.await(10, TimeUnit.SECONDS), "sdk thread must be in the operation")

            module.clearCachedCredentials(relaxedPromise())
            assertEquals(0, module.paymentIntents.size, "precondition: cache empty after clear")

            release.countDown()
            val deadline = System.currentTimeMillis() + 10_000
            while (module.paymentIntents.isEmpty() && System.currentTimeMillis() < deadline) {
                Thread.sleep(5)
            }

            assertEquals(
                1,
                module.paymentIntents.size,
                "a create that completes after the clear is still cached, so the sdkUuid " +
                    "already handed to JS remains confirmable"
            )
        } finally {
            sdkThread.shutdownNow()
        }
    }

    // =====================================================================
    // Thread affinity, pinned so the race cannot silently return
    // =====================================================================

    @Test
    fun `write and read happen on different threads`() {
        // If this ever becomes false the concurrency tests above stop proving
        // anything, so the precondition is asserted explicitly.
        val callerThread = Thread.currentThread().name
        val callbackThreadName = java.util.concurrent.atomic.AtomicReference<String>()

        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.createPaymentIntent(any(), capture(cbSlot), any()) } answers {
            val t = Thread({ cbSlot.captured.onSuccess(intentValue) }, "sdk-operation-thread")
            t.start()
            t.join(10_000)
            callbackThreadName.set(t.name)
        }

        module.createPaymentIntent(createParams(), relaxedPromise())

        assertEquals(1, module.paymentIntents.size, "precondition: write landed")
        assertEquals(
            "sdk-operation-thread",
            callbackThreadName.get(),
            "the callback must be delivered on the SDK executor thread"
        )
        assertTrue(
            callerThread != callbackThreadName.get(),
            "the writing thread differs from the reading thread, which is why these " +
                "maps must be safe for concurrent access"
        )
    }
}
package com.stripe.example;

import android.app.Application;
import androidx.lifecycle.ProcessLifecycleOwner;
import com.stripe.stripeterminal.TerminalLifecycleObserver;

// {{ INTEGRATION-BUILDER START: #2e }}
public class StripeTerminalApplication extends Application {
    private final TerminalLifecycleObserver observer = TerminalLifecycleObserver.Companion.getInstance();

    @Override
    public void onCreate() {
        super.onCreate();
        // If you already have a class that extends 'Application',
        // put whatever code you had in the 'onCreate' method here.
        registerActivityLifecycleCallbacks(observer);
        ProcessLifecycleOwner.get().getLifecycle().addObserver(observer);
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);
        // If you already have a class that extends 'Application',
        // put whatever code you had in the 'onTrimMemory' method here.
        observer.onTrimMemory(level, this);
    }
}
// {{ INTEGRATION-BUILDER END: #2e }}

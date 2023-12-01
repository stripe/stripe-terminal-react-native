package com.dev.app.stripeterminalreactnative;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import java.util.List;
import com.stripeterminalreactnative.StripeTerminalReactNativePackage;
import com.stripeterminalreactnative.TerminalApplicationDelegate;

public class MainApplication extends Application implements ReactApplication, Application.ActivityLifecycleCallbacks {

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // packages.add(new MyReactNativePackage());
          packages.add(new StripeTerminalReactNativePackage());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    registerActivityLifecycleCallbacks(this);
    TerminalApplicationDelegate.onCreate(this);
    SoLoader.init(this, /* native exopackage */ false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load();
    }
    ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }

  @Override
  public void onActivityCreated(@NonNull final Activity activity, @Nullable final Bundle savedInstanceState) {
    Log.d("onActivityCreated", activity.toString());
  }

  @Override
  public void onActivityStarted(@NonNull final Activity activity) {
    Log.d("onActivityStarted", activity.toString());
  }

  @Override
  public void onActivityResumed(@NonNull final Activity activity) {
    Log.d("onActivityResumed", activity.toString());
  }

  @Override
  public void onActivityPaused(@NonNull final Activity activity) {
    Log.d("onActivityPaused", activity.toString());
  }

  @Override
  public void onActivityStopped(@NonNull final Activity activity) {
    Log.d("onActivityStopped", activity.toString());
  }

  @Override
  public void onActivitySaveInstanceState(@NonNull final Activity activity, @NonNull final Bundle outState) {
    Log.d("onActivitySaveInstanceState", activity.toString());
  }

  @Override
  public void onActivityDestroyed(@NonNull final Activity activity) {
    Log.d("onActivityDestroyed", activity.toString());
  }
}

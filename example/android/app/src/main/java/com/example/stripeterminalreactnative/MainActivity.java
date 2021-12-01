package com.example.stripeterminalreactnative;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.ReactActivity;


public class MainActivity extends ReactActivity {
  public static final Integer REQUEST_CODE_LOCATION = 5000;

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "StripeTerminalReactNativeExample";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    if (ContextCompat.checkSelfPermission(this,
      Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
      String[] permissions = {Manifest.permission.ACCESS_FINE_LOCATION};
      // REQUEST_CODE_LOCATION should be defined on your app level
      ActivityCompat.requestPermissions(this, permissions, REQUEST_CODE_LOCATION);
    }

  }

  @Override
  public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);

    if (requestCode == REQUEST_CODE_LOCATION && grantResults.length > 0
      && grantResults[0] != PackageManager.PERMISSION_GRANTED) {
      throw new RuntimeException("Location services are required in order to " +
        "connect to a reader.");
    }
  }
}

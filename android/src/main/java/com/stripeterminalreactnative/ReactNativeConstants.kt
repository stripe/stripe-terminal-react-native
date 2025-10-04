package com.stripeterminalreactnative

enum class ReactNativeConstants(val listenerName: String) {
    CHANGE_CONNECTION_STATUS("didChangeConnectionStatus"),
    CHANGE_PAYMENT_STATUS("didChangePaymentStatus"),
    FETCH_TOKEN_PROVIDER("onFetchTokenProviderListener"),
    FINISH_DISCOVERING_READERS("didFinishDiscoveringReaders"),
    FINISH_INSTALLING_UPDATE("didFinishInstallingUpdate"),
    REQUEST_READER_DISPLAY_MESSAGE("didRequestReaderDisplayMessage"),
    REQUEST_READER_INPUT("didRequestReaderInput"),
    REPORT_AVAILABLE_UPDATE("didReportAvailableUpdate"),
    REPORT_UPDATE_PROGRESS("didReportReaderSoftwareUpdateProgress"),
    START_INSTALLING_UPDATE("didStartInstallingUpdate"),
    UPDATE_DISCOVERED_READERS("didUpdateDiscoveredReaders"),
    START_READER_RECONNECT("didStartReaderReconnect"),
    READER_RECONNECT_SUCCEED("didSucceedReaderReconnect"),
    READER_RECONNECT_FAIL("didFailReaderReconnect"),
    CHANGE_OFFLINE_STATUS("didChangeOfflineStatus"),
    FORWARD_PAYMENT_INTENT("didForwardPaymentIntent"),
    REPORT_FORWARDING_ERROR("didReportForwardingError"),
    DISCONNECT("didDisconnect"),
    UPDATE_BATTERY_LEVEL("didUpdateBatteryLevel"),
    REPORT_LOW_BATTERY_WARNING("didReportLowBatteryWarning"),
    REPORT_READER_EVENT("didReportReaderEvent"),
}

enum class DeviceSerialName(val serialName: String) {
    CHIPPER_1X("chipper1X"),
    CHIPPER_2X("chipper2X"),
    ETNA("etna"),
    STRIPE_M2("stripeM2"),
    STRIPE_S700("stripeS700"),
    STRIPE_S700_DEVKIT("stripeS700Devkit"),
    STRIPE_S710("stripeS710"),
    STRIPE_S710_DEVKIT("stripeS710Devkit"),
    STRIPE_T600("stripeT600"),
    STRIPE_T610("stripeT610"),
    STRIPE_T600_DEVKIT("stripeT600Devkit"),
    STRIPE_T610_DEVKIT("stripeT610Devkit"),
    UNKNOWN("unknown"),
    VERIFONE_P400("verifoneP400"),
    WISECUBE("wiseCube"),
    WISEPAD_3("wisePad3"),
    WISEPAD_3S("wisePad3s"),
    WISEPOS_E("wisePosE"),
    WISEPOS_E_DEVKIT("wisePosEDevkit"),
    TAP_TO_PAY_DEVICE("tapToPay"),
    VERIFONE_V660P("verifoneV660P"),
    VERIFONE_V660P_DEVKIT("verifoneV660PDevkit"),
    VERIFONE_M425("verifoneM425"),
    VERIFONE_M450("verifoneM450"),
    VERIFONE_P630("verifoneP630"),
    VERIFONE_UX700("verifoneUX700"),
    VERIFONE_UX700_DEVKIT("verifoneUX700Devkit");

    companion object {
        private val serialNames = DeviceSerialName.entries.associateBy(DeviceSerialName::serialName)

        fun fromSerialName(serialName: String): DeviceSerialName? = serialNames[serialName]
    }
}

enum class SurchargeConsentCollection(val collection: String) {
    DISABLED("disabled"),
    ENABLED("enabled");

    companion object {
        private val collections = SurchargeConsentCollection.entries.associateBy(SurchargeConsentCollection::collection)

        fun fromCollection(collection: String): SurchargeConsentCollection? = collections[collection]
    }
}

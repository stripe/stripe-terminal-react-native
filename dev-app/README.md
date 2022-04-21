# Developer / QA App

If you are looking for a reference implementation to use as prior art to build an integration, please make use of our [example app](../example-app).

This app is intended for development of the SDK and QA validation within stripe, it does not make use of a merchant backend in order to enable ad-hoc account switching to move through various countries and accounts with alternate configurations. It _should not_ be used as a starting point for a merchant SDK integration as it makes use of various insecure practices such as sending a merchant private key over the wire on every call.

"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var stripe_1 = require("stripe");
var express_1 = require("express");
var winston_1 = require("winston");
var express_winston_1 = require("express-winston");
require("dotenv/config");
if (!process.env.STRIPE_PRIVATE_KEY) {
    console.error("No Stripe API Key found!\nPlease ensure you've created a .env file and followed the setup instructions at https://github.com/stripe/stripe-terminal-react-native#run-the-example-app!");
    process.exit(-1);
}
var secret_key = process.env.STRIPE_PRIVATE_KEY;
var stripe = new stripe_1["default"](secret_key, {
    apiVersion: '2020-08-27',
    typescript: true
});
var app = (0, express_1["default"])();
var port = process.env.PORT ? process.env.PORT : 3002;
app.use(express_1["default"].json());
express_winston_1["default"].requestWhitelist.push('body');
express_winston_1["default"].responseWhitelist.push('body');
app.use(express_winston_1["default"].logger({
    transports: [new winston_1["default"].transports.Console()],
    format: winston_1["default"].format.combine(winston_1["default"].format.colorize(), winston_1["default"].format.json(), winston_1["default"].format.prettyPrint())
}));
app.post('/connection_token', function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var connectionToken;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, stripe.terminal.connectionTokens.create()];
            case 1:
                connectionToken = _a.sent();
                res.json({ secret: connectionToken.secret });
                return [2 /*return*/];
        }
    });
}); });
app.post('/create_payment_intent', function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var intent;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, stripe.paymentIntents.create({
                    amount: 1000,
                    currency: 'usd',
                    payment_method_types: ['card_present'],
                    capture_method: 'manual'
                })];
            case 1:
                intent = _a.sent();
                res.json({ id: intent.id, client_secret: intent.client_secret });
                return [2 /*return*/];
        }
    });
}); });
app.post('/capture_payment_intent', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var intent;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, stripe.paymentIntents.capture(req.body.id)];
            case 1:
                intent = _a.sent();
                res.json({ intent: intent });
                return [2 /*return*/];
        }
    });
}); });
app.post('/create_setup_intent', function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var intent;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, stripe.setupIntents.create({
                    payment_method_types: ['card_present']
                })];
            case 1:
                intent = _a.sent();
                res.json({ client_secret: intent.client_secret });
                return [2 /*return*/];
        }
    });
}); });
app.get('/create_location', function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var location;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, stripe.terminal.locations.create({
                    display_name: 'HQ',
                    address: {
                        line1: '1272 Valencia Street',
                        city: 'San Francisco',
                        state: 'CA',
                        country: 'US',
                        postal_code: '94110'
                    }
                })];
            case 1:
                location = _a.sent();
                res.json({ location: location });
                return [2 /*return*/];
        }
    });
}); });
app.get('/get_locations', function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var locations;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, stripe.terminal.locations.list()];
            case 1:
                locations = _a.sent();
                res.json({ locations: locations.data });
                return [2 /*return*/];
        }
    });
}); });
app.get('/get_customers', function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var customers;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, stripe.customers.list()];
            case 1:
                customers = _a.sent();
                res.json({ customers: customers.data });
                return [2 /*return*/];
        }
    });
}); });
app.post('/register_reader', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var reader, error_1, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, stripe.terminal.readers.create(__assign({}, req.body))];
            case 1:
                reader = _a.sent();
                res.json({ reader: reader });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                errorMessage = 'Unknown error';
                if (error_1 instanceof Error) {
                    errorMessage = error_1.message;
                }
                res.json({ error: errorMessage });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// 404 error handler - this should always be the last route
app.use(function (req, res, _) {
    var url = "".concat(req.protocol, "://").concat(req.get('host')).concat(req.originalUrl);
    res.status(404).send(res.json({
        errorCode: '404',
        errorMessage: "Route not found ".concat(url)
    }));
});
app.listen(port, function () {
    console.log('Running on port ' + port);
});

// ignore_for_file: avoid_print

import 'dart:async';
import 'dart:developer';
import 'dart:typed_data';

import 'package:whatsapp_bot_flutter_web/src/bot_js.dart' as bot_js;
import 'package:whatsapp_bot_flutter_web/src/wpclient_web.dart';
import 'package:whatsapp_bot_platform_interface/whatsapp_bot_platform_interface.dart';

class WhatsappBotFlutterWeb {
  /// Connect method wil open whatsapp web in a new tab and return the client
  /// make sure you scan qr code manually for now
  static Future<WhatsappClient?> connect({
    Function(ConnectionEvent)? onConnectionEvent,
    String? linkWithPhoneNumber,
    Function(String code)? onPhoneLinkCode,
    Function(String qrCodeUrl, Uint8List? qrCodeImage)? onQrCode,
    int qrCodeWaitDurationSeconds = 60,
    Duration wppInitTimeout = const Duration(seconds: 15),
  }) async {
    WpClientInterface? wpClient;
    try {
      log('Initializationg whastsapp client');
      onConnectionEvent?.call(ConnectionEvent.initializing);
      // Completer completer = Completer();

      String tabId = '';
      bot_js.connect(
        bot_js.JsCallback((data) {
          log("ConnectedToTab : $data");
        }),
        bot_js.JsCallback((data) async {
          log("WebPackReady : $data");
          tabId = (data is Future) ? await data : data.toString();
          // completer.complete(data);
        }),
      );
      // var tabId = await completer.future;

      wpClient = WpClientWeb(tabId: tabId);
      await WppConnect.init(
        wpClient,
        wppJsContent: "",
        waitTimeOut: wppInitTimeout,
      );

      onConnectionEvent?.call(ConnectionEvent.waitingForLogin);

      await waitForLogin(
        wpClient,
        onConnectionEvent: onConnectionEvent,
        onQrCode: onQrCode,
        linkWithPhoneNumber: linkWithPhoneNumber,
        onPhoneLinkCode: onPhoneLinkCode,
        waitDurationSeconds: qrCodeWaitDurationSeconds,
      );

      var client = WhatsappClient(wpClient: wpClient);
      onConnectionEvent?.call(ConnectionEvent.connected);
      return client;
    } catch (e) {
      WhatsappLogger.log(e.toString());
      log('Test $e');
      wpClient?.dispose();
      rethrow;
    }
  }
}

package clublink.golfrules.playtrack;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BackgroundLocation")
public class BackgroundLocation extends Plugin {

    private static final String TAG = "BgLocationPlugin";

    private BroadcastReceiver receiver;

    @Override
    protected void handleOnStart() {
        super.handleOnStart();
        registerReceiverSafely();
    }

    private void registerReceiverSafely() {
        try {
            if (receiver != null) {
                getContext().unregisterReceiver(receiver);
            }
        } catch (Exception ignored) {}

        IntentFilter filter = new IntentFilter("LOCATION_UPDATE");

        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {

                Log.d(TAG, "RECEIVED BROADCAST FROM SERVICE");

                double lat = intent.getDoubleExtra("lat", 0);
                double lng = intent.getDoubleExtra("lng", 0);

                JSObject data = new JSObject();
                data.put("lat", lat);
                data.put("lng", lng);

                Log.d(TAG, "Forwarding location to JS: " + data.toString());

                notifyListeners("location", data);
            }
        };

        getContext().registerReceiver(receiver, filter);

        Log.d(TAG, "Receiver registered");
    }

    @PluginMethod
    public void start(PluginCall call) {
        Log.d(TAG, "Starting LocationService");

        // ⭐ CONTEXT CORRETTO PER CAPACITOR 4
        Context appContext = getActivity().getApplicationContext();

        Intent serviceIntent = new Intent(appContext, LocationService.class);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            appContext.startForegroundService(serviceIntent);
        } else {
            appContext.startService(serviceIntent);
        }

        JSObject ret = new JSObject();
        ret.put("status", "started");
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Log.d(TAG, "Stopping LocationService");

        // ⭐ CONTEXT CORRETTO ANCHE QUI
        Context appContext = getActivity().getApplicationContext();

        Intent serviceIntent = new Intent(appContext, LocationService.class);
        appContext.stopService(serviceIntent);

        JSObject ret = new JSObject();
        ret.put("status", "stopped");
        call.resolve(ret);
    }
}

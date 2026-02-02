package clublink.golfrules.playtrack;

import android.app.Service;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.os.IBinder;
import android.os.Build;
import android.location.Location;
import android.os.PowerManager;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;

public class LocationService extends Service {

    private FusedLocationProviderClient fusedClient;
    private LocationCallback callback;

    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "PlayTrack::GPSWakeLock"
        );
        wakeLock.acquire();

        createNotificationChannel();

        Notification notification = new Notification.Builder(this, "gps_channel")
                .setContentTitle("PlayTrack GPS Attivo")
                .setContentText("Tracking in corso…")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .build();

        startForeground(1, notification);

        fusedClient = LocationServices.getFusedLocationProviderClient(this);

        callback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult result) {
                if (result == null) return;

                for (Location location : result.getLocations()) {
                    broadcastLocation(location);
                }
            }
        };

        LocationRequest request = LocationRequest.create();
        request.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        request.setInterval(5000);
        request.setFastestInterval(2000);
        request.setSmallestDisplacement(1f);

        fusedClient.requestLocationUpdates(request, callback, getMainLooper());
    }

    private void broadcastLocation(Location location) {
        Intent intent = new Intent("LOCATION_UPDATE");
        intent.setPackage(getPackageName()); // RIGA DECISIVA

        intent.putExtra("lat", location.getLatitude());
        intent.putExtra("lng", location.getLongitude());

        sendBroadcast(intent);
    }

    @Override
    public void onDestroy() {
        fusedClient.removeLocationUpdates(callback);

        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }

        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    "gps_channel",
                    "GPS Tracking",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
}

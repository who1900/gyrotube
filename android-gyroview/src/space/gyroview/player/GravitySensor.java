package space.gyroview.player;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

/** Native gravity direction for the page: TYPE_GAME_ROTATION_VECTOR (gyro+accel fusion, no magnetometer jumps),
 *  fallback TYPE_ROTATION_VECTOR, at SENSOR_DELAY_GAME. JS polls rv() once per animation frame and gets
 *  "seq,gx,gy,gz" — gravity unit vector in the W3C device frame (upright portrait = 0,-1,0). */
final class GravitySensor implements SensorEventListener {
    private final SensorManager sm;
    private final float[] R = new float[9];
    private volatile String last = "";
    private long seq;
    private boolean active, wanted;

    GravitySensor(Context c) { sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE); }

    private Sensor pick() {
        if (sm == null) return null;
        Sensor s = sm.getDefaultSensor(Sensor.TYPE_GAME_ROTATION_VECTOR);
        return s != null ? s : sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
    }
    synchronized boolean start() {
        wanted = true;
        if (active) return true;
        Sensor s = pick();
        if (s == null) return false;
        active = sm.registerListener(this, s, SensorManager.SENSOR_DELAY_GAME);
        return active;
    }
    synchronized void stop() { wanted = false; pause(); }
    /** lifecycle: release the sensor but remember that the page wants it */
    synchronized void pause() { if (active) { sm.unregisterListener(this); active = false; } }
    synchronized void resume() { if (wanted && !active) { boolean w = wanted; start(); wanted = w; } }
    String read() { return last; }

    @Override public void onSensorChanged(SensorEvent e) {
        SensorManager.getRotationMatrixFromVector(R, e.values);
        // Row 3 of R = world "up" in device coords; gravity = -up.
        last = (++seq) + "," + (-R[6]) + "," + (-R[7]) + "," + (-R[8]);
    }
    @Override public void onAccuracyChanged(Sensor s, int a) {}
}

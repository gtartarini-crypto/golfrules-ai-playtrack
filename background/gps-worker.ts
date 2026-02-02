// background/gps-worker.ts
import { BackgroundRunner } from '@capacitor/background-runner';

console.log("### GPS WORKER FILE LOADED ###");

function gpsWorker() {
  console.log("### GPS WORKER PARTITO (HEARTBEAT MODE) ###");

  // 🔥 Heartbeat ogni 15 secondi (puoi cambiarlo)
  setInterval(() => {
    BackgroundRunner.dispatchEvent({
      name: 'gps-heartbeat',
      data: { ts: Date.now() }
    });
  }, 15000);
}

export default gpsWorker;

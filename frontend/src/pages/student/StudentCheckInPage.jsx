import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import AppShell from '../../components/AppShell';
import { useAuthStore } from '../../store/authStore';
import { checkIn } from '../../api/studentApi';
import {
  insecureContextMessage,
  isSecureContext,
} from '../../utils/secureContext';
import { studentNavItems } from './studentNav';

export default function StudentCheckInPage() {
  const token = useAuthStore((state) => state.token);
  const scannerRef = useRef(null);

  const [qrToken, setQrToken] = useState('');
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [geoStatus, setGeoStatus] = useState('');
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);

  const [scannerError, setScannerError] = useState('');
  const [scannerStatus, setScannerStatus] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  function requestGeolocation() {
    if (!isSecureContext()) {
      setGeoError(insecureContextMessage());
      setGeoStatus('');
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Геолокація не підтримується цим браузером');
      setGeoStatus('');
      return;
    }

    setIsLoadingGeo(true);
    setGeoError('');
    setGeoStatus('Запитуємо доступ до геолокації...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeoError('');
        setGeoStatus('Геолокацію отримано');
        setIsLoadingGeo(false);
      },
      (error) => {
        setCoords(null);
        const reason =
          error?.code === 1
            ? 'Доступ до геолокації заборонено в налаштуваннях браузера/телефона.'
            : 'Не вдалося отримати геолокацію. Спробуйте ще раз і дозвольте доступ.';
        setGeoError(reason);
        setGeoStatus('');
        setIsLoadingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function startCamera() {
    if (scannerActive || isStartingCamera) return;

    if (!isSecureContext()) {
      setScannerError(insecureContextMessage());
      setScannerStatus('');
      return;
    }

    setIsStartingCamera(true);
    setScannerError('');
    setScannerStatus('Запитуємо доступ до камери...');

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          setQrToken(decodedText);
        },
        () => {}
      );

      setScannerActive(true);
      setScannerStatus('Камера увімкнена');
      setScannerError('');
    } catch {
      scannerRef.current = null;
      setScannerActive(false);
      setScannerStatus('');
      setScannerError('Камера недоступна або доступ заборонено');
    } finally {
      setIsStartingCamera(false);
    }
  }

  async function stopCamera() {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {}

    scannerRef.current = null;
    setScannerActive(false);
    setScannerStatus('Камеру вимкнено');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const finalToken = qrToken.trim();

    if (!finalToken) {
      setIsError(true);
      setMessage('Вкажіть QR-код');
      return;
    }

    if (!coords) {
      setIsError(true);
      setMessage('Потрібна геолокація');
      return;
    }

    setIsSaving(true);
    setMessage('');
    setIsError(false);

    try {
      const data = await checkIn(token, {
        qrToken: finalToken,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      setIsError(false);
      setMessage(data.message || 'Присутність підтверджено');
    } catch (err) {
      setIsError(true);
      const distance = err.data?.distanceMeters;
      const allowed = err.data?.allowedRadiusMeters;
      const extra =
        distance != null && allowed != null
          ? ` (відстань ≈ ${distance} м, дозволено ${allowed} м)`
          : '';
      setMessage(
        `${err.message || 'Не вдалося підтвердити присутність'}${extra}`
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Кабінет студента" navItems={studentNavItems}>
      <section>
        <h1 className="text-2xl font-semibold text-ink">Відмітка присутності</h1>

        {!isSecureContext() ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {insecureContextMessage()}
          </p>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Геолокація</h2>

            <button
              type="button"
              onClick={requestGeolocation}
              disabled={isLoadingGeo}
              className="mt-4 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-surface disabled:opacity-60"
            >
              {isLoadingGeo
                ? 'Очікуємо дозвіл...'
                : coords
                  ? 'Оновити геолокацію'
                  : 'Надати доступ до геолокації'}
            </button>

            {geoError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
                {geoError}
              </p>
            ) : null}

            {geoStatus && !geoError ? (
              <p className="mt-3 text-sm text-success">{geoStatus}</p>
            ) : null}

            {coords ? (
              <p className="mt-3 text-sm text-muted">
                Широта: {coords.latitude.toFixed(6)}
                <br />
                Довгота: {coords.longitude.toFixed(6)}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Камера</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {!scannerActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isStartingCamera}
                  className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-surface disabled:opacity-60"
                >
                  {isStartingCamera
                    ? 'Очікуємо дозвіл...'
                    : 'Надати доступ до камери'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
                >
                  Вимкнути камеру
                </button>
              )}
            </div>

            <div id="qr-reader" className="mt-3 overflow-hidden rounded-xl" />

            {scannerStatus ? (
              <p className="mt-3 text-sm text-success">{scannerStatus}</p>
            ) : null}
            {scannerError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
                {scannerError}
              </p>
            ) : null}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-line bg-white p-5"
        >
          <label className="block text-sm font-medium text-ink">
            QR-код
            <input
              value={qrToken}
              onChange={(event) => setQrToken(event.target.value)}
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <button
            type="submit"
            disabled={isSaving || !coords}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
          >
            {isSaving ? 'Перевірка...' : 'Підтвердити присутність'}
          </button>
        </form>

        {message ? (
          <p
            className={[
              'mt-4 rounded-lg px-3 py-2 text-sm',
              isError ? 'bg-red-50 text-danger' : 'bg-green-50 text-success',
            ].join(' ')}
          >
            {message}
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}

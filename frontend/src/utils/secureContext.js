export function isSecureContext() {
  return window.isSecureContext === true;
}

export function insecureContextMessage() {
  return (
    'Браузер блокує гео/камеру на звичайному http. ' +
    'Відкрийте сайт через https (наприклад https://localhost:5173 або https://IP:5173) ' +
    'і підтвердіть попередження про сертифікат.'
  );
}

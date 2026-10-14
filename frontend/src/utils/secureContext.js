export function isSecureContext() {
  return window.isSecureContext === true;
}

export function insecureContextMessage() {
  return 'Геолокація та камера доступні лише через HTTPS. Відкрийте сайт за захищеним посиланням.';
}

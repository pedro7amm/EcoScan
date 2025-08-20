EcoScan (Ionic Angular + Capacitor)
Laboratorio #3 - Programacion 4

Descripción
- App móvil para registrar actividades ecológicas sin conexión:
  - Escanear códigos QR de productos/lugares.
  - Tomar fotografías con título y descripción.
  - Registrar ubicación asociada a la última actividad.
  - Historial unificado por fecha y exportación a PDF.

Pasos para ejecutar
1) Instalar dependencias
```bash
cd EcoScan
npm install
```
2) Desarrollo web
```bash
ionic serve
```
3) Compilar y sincronizar Capacitor
```bash
npm run build
npx cap sync
```
4) Android
```bash
npx cap add android   
npx cap open android
```
5) iOS (macOS)
```bash
npx cap add ios       
npx cap open ios
```

Plugins y librerías
- @capacitor/camera (cámara)
- @capacitor/geolocation (geolocalización)
- @capacitor/haptics (vibración)
- @capacitor/preferences (almacenamiento local)
- @capacitor-mlkit/barcode-scanning (lector QR/Barcode)
- html2canvas + jspdf (exportación a PDF)


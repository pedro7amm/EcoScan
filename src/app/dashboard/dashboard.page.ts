import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { HistorialService } from '../services/historial.service';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class PaginaDashboard implements OnInit {
	fotoDataUrl: string | null = null;
	coordenadasTexto: string | null = null;

	constructor(
		private router: Router,
		private toastController: ToastController,
		private alertController: AlertController,
		private historialService: HistorialService,
		private ui: UiService
	) { }

	ngOnInit() {}

	private async activarVibracion(): Promise<void> {
		try {
			await Haptics.impact({ style: ImpactStyle.Light });
		} catch {}
	}

	async escanearQr(): Promise<void> {
		await this.ui.vibrar();
		try {
			const soporte = await BarcodeScanner.isSupported();
			if (!soporte.supported) {
				await this.mostrarToast('Escaneo no soportado en esta plataforma');
				return;
			}
			await BarcodeScanner.requestPermissions();
			const resultado = await BarcodeScanner.scan();
			const valor = resultado.barcodes?.[0]?.rawValue ?? 'Sin resultados';
			await this.historialService.guardarEscaneo(valor);
			await this.mostrarToast(`QR: ${valor}`);
			await this.ui.vibrar();
		} catch (error) {
			await this.mostrarToast('Error al escanear');
			console.error(error);
		}
	}

	async tomarFoto(): Promise<void> {
		await this.ui.vibrar();
		try {
			const foto = await Camera.getPhoto({
				resultType: CameraResultType.DataUrl,
				source: CameraSource.Camera,
				quality: 70
			});
			this.fotoDataUrl = foto.dataUrl ?? null;
			if (!this.fotoDataUrl) {
				await this.mostrarToast('No se pudo capturar la foto');
				return;
			}
			const metadatos = await this.solicitarMetadatosFoto();
			if (!metadatos) {
				await this.mostrarToast('Captura cancelada');
				return;
			}
			await this.historialService.guardarFoto(this.fotoDataUrl, metadatos.titulo, metadatos.descripcion);
			await this.mostrarToast('Foto guardada');
			await this.ui.vibrar();
		} catch (error) {
			this.fotoDataUrl = null;
			await this.mostrarToast('No se pudo capturar la foto');
			console.error(error);
		}
	}

	async obtenerUbicacion(): Promise<void> {
		await this.ui.vibrar();
		try {
			const tipo = await this.seleccionarAsociacion();
			if (!tipo) {
				return;
			}
			const referencia = await this.obtenerReferenciaActividad(tipo);
			if (!referencia) {
				await this.mostrarToast('No hay actividad previa para asociar');
				return;
			}
			await Geolocation.requestPermissions();
			const posicion = await Geolocation.getCurrentPosition();
			const { latitude, longitude } = posicion.coords;
			this.coordenadasTexto = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
			await this.historialService.guardarUbicacion(tipo, referencia, latitude, longitude);
			await this.mostrarToast(`Ubicación guardada (${this.coordenadasTexto})`);
			await this.ui.vibrar();
		} catch (error) {
			this.coordenadasTexto = null;
			await this.mostrarToast('No se pudo obtener la ubicación');
			console.error(error);
		}
	}

	irHistorial(): void {
		this.router.navigate(['/historial']);
	}

	async mostrarToast(mensaje: string): Promise<void> {
		const toast = await this.toastController.create({ message: mensaje, duration: 2000, position: 'bottom' });
		await toast.present();
	}

	private async solicitarMetadatosFoto(): Promise<{ titulo: string; descripcion: string } | null> {
		return new Promise(async (resolve) => {
			let metadatos: { titulo: string; descripcion: string } | null = null;
			const alerta = await this.alertController.create({
				header: 'Detalles de la foto',
				inputs: [
					{ name: 'titulo', type: 'text', placeholder: 'Título' },
					{ name: 'descripcion', type: 'text', placeholder: 'Descripción breve' }
				],
				buttons: [
					{ text: 'Cancelar', role: 'cancel' },
					{ text: 'Guardar', role: 'confirm', handler: (data: any) => {
						metadatos = { titulo: data?.titulo ?? '', descripcion: data?.descripcion ?? '' };
					}}
				]
			});
			await alerta.present();
			const { role } = await alerta.onDidDismiss();
			resolve(role === 'confirm' ? metadatos : null);
		});
	}


	private async seleccionarAsociacion(): Promise<'escaneo' | 'foto' | null> {
		return new Promise(async (resolve) => {
			let seleccion: 'escaneo' | 'foto' | null = null;
			const alerta = await this.alertController.create({
				header: 'Asociar ubicación a',
				inputs: [
					{ name: 'escaneo', type: 'radio', label: 'Último escaneo', value: 'escaneo', checked: true },
					{ name: 'foto', type: 'radio', label: 'Última foto', value: 'foto' }
				],
				buttons: [
					{ text: 'Cancelar', role: 'cancel' },
					{ text: 'Seleccionar', role: 'confirm', handler: (data: any) => { seleccion = data as ('escaneo'|'foto'); } }
				]
			});
			await alerta.present();
			const { role } = await alerta.onDidDismiss();
			resolve(role === 'confirm' ? seleccion : null);
		});
	}

	private async obtenerReferenciaActividad(tipo: 'escaneo' | 'foto'): Promise<string | null> {
		if (tipo === 'escaneo') {
			return this.historialService.obtenerUltimoEscaneo();
		}
		return this.historialService.obtenerReferenciaUltimaFoto();
	}
}

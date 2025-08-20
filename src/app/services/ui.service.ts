import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Servicio de UI para retroalimentación rápida al usuario
 * (toasts y vibración háptica).
 */
@Injectable({ providedIn: 'root' })
export class UiService {
	constructor(private toastController: ToastController) {}

	async mostrarToast(mensaje: string): Promise<void> {
		const toast = await this.toastController.create({ message: mensaje, duration: 2000, position: 'bottom' });
		await toast.present();
	}

	async vibrar(): Promise<void> {
		try {
			await Haptics.impact({ style: ImpactStyle.Light });
		} catch {}
	}
}



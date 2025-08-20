import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { HistorialService } from '../services/historial.service';
import { UiService } from '../services/ui.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class HistorialPage implements OnInit {
	registros: Array<{ contenido: string; fechaIso: string }> = [];
	fotos: Array<{ imagenDataUrl: string; titulo: string; descripcion: string; fechaIso: string }> = [];
	ubicaciones: Array<{ tipo: 'escaneo'|'foto'; referencia: string; lat: number; lng: number; fechaIso: string }> = [];
	actividades: Array<{
		tipo: 'foto'|'escaneo'|'ubicacion';
		fechaIso: string;
		// foto
		imagenDataUrl?: string;
		titulo?: string;
		descripcion?: string;
		// qr
		qrContenido?: string;
		// ubicacion
		lat?: number;
		lng?: number;
		referencia?: string;
	}> = [];

	constructor(private toastController: ToastController, private historialService: HistorialService, private ui: UiService, private router: Router) { }

	async ngOnInit() {
		await this.cargarRegistros();
	}

	// Refresca cada vez que la vista entra en foco
	ionViewWillEnter(): void {
		this.cargarRegistros();
	}

	private async cargarRegistros(): Promise<void> {
		try {
			this.actividades = await this.historialService.cargarActividades();
		} catch (error) {
			this.registros = [];
			this.fotos = [];
			this.ubicaciones = [];
			this.actividades = [];
			await this.mostrarToast('No se pudo cargar el historial');
		}
	}

	async limpiarHistorial(): Promise<void> {
		await this.historialService.limpiarTodo();
		await this.cargarRegistros();
		await this.mostrarToast('Historial limpiado');
	}

	async mostrarToast(mensaje: string): Promise<void> {
		const toast = await this.toastController.create({ message: mensaje, duration: 2000, position: 'bottom' });
		await toast.present();
	}

    irMenuPrincipal(): void {
        this.router.navigate(['/dashboard']);
    }

	async descargarPdf(): Promise<void> {
		try {
			// Construir un DOM temporal sin componentes Ionic (evita Shadow DOM)
			const temporal = this.crearDomExportacion();
			document.body.appendChild(temporal);
			const canvas = await html2canvas(temporal, { scale: 2, backgroundColor: '#ffffff' });
			const imgData = canvas.toDataURL('image/png');
			const pdf = new jsPDF('p', 'mm', 'a4');
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const imgWidth = pageWidth - 20; // márgenes laterales
			let imgHeight = (canvas.height * imgWidth) / canvas.width;
			if (imgHeight > pageHeight - 20) {
				imgHeight = pageHeight - 20; // ajustar a una página por simplicidad
			}
			pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

			const nombre = `historial_ecoscan_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`;
			pdf.save(nombre);
			await this.mostrarToast('PDF descargado');
			// limpiar DOM temporal
			document.body.removeChild(temporal);
		} catch (error) {
			await this.mostrarToast('Error al generar PDF');
			console.error(error);
		}
	}

	private crearDomExportacion(): HTMLElement {
		const wrapper = document.createElement('div');
		wrapper.style.width = '800px';
		wrapper.style.padding = '16px';
		wrapper.style.background = '#ffffff';
		wrapper.style.color = '#000000';

		const header = document.createElement('div');
		header.style.display = 'flex';
		header.style.justifyContent = 'space-between';
		header.style.marginBottom = '12px';
		header.innerHTML = `<h2 style="margin:0">EcoScan - Historial</h2><span>${new Date().toLocaleString()}</span>`;
		wrapper.appendChild(header);

		const list = document.createElement('div');
		for (const a of this.actividades) {
			const item = document.createElement('div');
			item.style.border = '1px solid #ddd';
			item.style.borderRadius = '8px';
			item.style.padding = '8px';
			item.style.marginBottom = '8px';

			const title = document.createElement('div');
			title.style.fontWeight = '600';
			title.textContent = `${a.tipo.toUpperCase()} - ${new Date(a.fechaIso).toLocaleString()}`;
			item.appendChild(title);

			if (a.tipo === 'foto' && a.imagenDataUrl) {
				const img = document.createElement('img');
				img.src = a.imagenDataUrl;
				img.style.width = '120px';
				img.style.height = 'auto';
				img.style.display = 'block';
				img.style.marginTop = '6px';
				item.appendChild(img);
				const meta = document.createElement('div');
				meta.textContent = `${a.titulo || 'Sin título'} - ${a.descripcion || 'Sin descripción'}`;
				item.appendChild(meta);
			}

			if (a.tipo === 'escaneo' && a.qrContenido) {
				const qr = document.createElement('div');
				qr.textContent = `QR: ${a.qrContenido}`;
				item.appendChild(qr);
			}

			if (a.tipo === 'ubicacion') {
				const loc = document.createElement('div');
				loc.textContent = `Ubicación: ${a.lat}, ${a.lng} - ${a.referencia || ''}`;
				item.appendChild(loc);
			}

			list.appendChild(item);
		}

		wrapper.appendChild(list);
		return wrapper;
	}
}

import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Servicio responsable de la persistencia local y agregación del historial
 * (escaneos, fotos y ubicaciones). Usa Capacitor Preferences para funcionar sin conexión.
 */
@Injectable({ providedIn: 'root' })
export class HistorialService {
	private readonly claveEscaneos = 'historial_escaneos';
	private readonly claveFotos = 'historial_fotos';
	private readonly claveUbicaciones = 'historial_ubicaciones';

	/** Guarda un escaneo de QR con contenido y fecha. */
	async guardarEscaneo(contenido: string): Promise<void> {
		const existente = await Preferences.get({ key: this.claveEscaneos });
		const lista: Array<{ contenido: string; fechaIso: string }> = existente.value ? JSON.parse(existente.value) : [];
		lista.push({ contenido, fechaIso: new Date().toISOString() });
		await Preferences.set({ key: this.claveEscaneos, value: JSON.stringify(lista) });
	}

	/** Guarda una foto con metadatos (título, descripción) y fecha. */
	async guardarFoto(imagenDataUrl: string, titulo: string, descripcion: string): Promise<void> {
		const existente = await Preferences.get({ key: this.claveFotos });
		const lista: Array<{ imagenDataUrl: string; titulo: string; descripcion: string; fechaIso: string }> = existente.value ? JSON.parse(existente.value) : [];
		lista.push({ imagenDataUrl, titulo, descripcion, fechaIso: new Date().toISOString() });
		await Preferences.set({ key: this.claveFotos, value: JSON.stringify(lista) });
	}

	/** Guarda una ubicación asociada a una referencia de escaneo o foto. */
	async guardarUbicacion(tipo: 'escaneo' | 'foto', referencia: string, lat: number, lng: number): Promise<void> {
		const existente = await Preferences.get({ key: this.claveUbicaciones });
		const lista: Array<{ tipo: 'escaneo'|'foto'; referencia: string; lat: number; lng: number; fechaIso: string }> = existente.value ? JSON.parse(existente.value) : [];
		lista.push({ tipo, referencia, lat, lng, fechaIso: new Date().toISOString() });
		await Preferences.set({ key: this.claveUbicaciones, value: JSON.stringify(lista) });
	}

	/** Obtiene el último contenido de escaneo (si existe). */
	async obtenerUltimoEscaneo(): Promise<string | null> {
		const existente = await Preferences.get({ key: this.claveEscaneos });
		const lista: Array<{ contenido: string; fechaIso: string }> = existente.value ? JSON.parse(existente.value) : [];
		const ultimo = lista[lista.length - 1];
		return ultimo ? ultimo.contenido : null;
	}

	/** Obtiene una referencia de la última foto (título o descripción). */
	async obtenerReferenciaUltimaFoto(): Promise<string | null> {
		const existente = await Preferences.get({ key: this.claveFotos });
		const lista: Array<{ imagenDataUrl: string; titulo: string; descripcion: string; fechaIso: string }> = existente.value ? JSON.parse(existente.value) : [];
		const ultimo = lista[lista.length - 1];
		return ultimo ? (ultimo.titulo || ultimo.descripcion || 'Foto sin título') : null;
	}

	/** Devuelve una lista unificada de actividades ordenadas por fecha descendente. */
	async cargarActividades(): Promise<Array<{
		tipo: 'foto'|'escaneo'|'ubicacion';
		fechaIso: string;
		imagenDataUrl?: string;
		titulo?: string;
		descripcion?: string;
		qrContenido?: string;
		lat?: number;
		lng?: number;
		referencia?: string;
	}>> {
		const [escaneos, fotos, ubic] = await Promise.all([
			Preferences.get({ key: this.claveEscaneos }),
			Preferences.get({ key: this.claveFotos }),
			Preferences.get({ key: this.claveUbicaciones })
		]);
		const registros = escaneos.value ? JSON.parse(escaneos.value) as Array<{ contenido: string; fechaIso: string }> : [];
		const fotosLista = fotos.value ? JSON.parse(fotos.value) as Array<{ imagenDataUrl: string; titulo: string; descripcion: string; fechaIso: string }> : [];
		const ubicLista = ubic.value ? JSON.parse(ubic.value) as Array<{ tipo: 'escaneo'|'foto'; referencia: string; lat: number; lng: number; fechaIso: string }> : [];
		return [
			...fotosLista.map(f => ({ tipo: 'foto' as const, fechaIso: f.fechaIso, imagenDataUrl: f.imagenDataUrl, titulo: f.titulo, descripcion: f.descripcion })),
			...registros.map(r => ({ tipo: 'escaneo' as const, fechaIso: r.fechaIso, qrContenido: r.contenido })),
			...ubicLista.map(u => ({ tipo: 'ubicacion' as const, fechaIso: u.fechaIso, lat: u.lat, lng: u.lng, referencia: u.referencia }))
		].sort((a, b) => new Date(b.fechaIso).getTime() - new Date(a.fechaIso).getTime());
	}

	/** Borra todo el historial (escaneos, fotos y ubicaciones). */
	async limpiarTodo(): Promise<void> {
		await Preferences.set({ key: this.claveEscaneos, value: JSON.stringify([]) });
		await Preferences.set({ key: this.claveFotos, value: JSON.stringify([]) });
		await Preferences.set({ key: this.claveUbicaciones, value: JSON.stringify([]) });
	}
}



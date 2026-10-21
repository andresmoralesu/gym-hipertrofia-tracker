/**
 * 🌐 GOOGLE SHEETS SERVICE
 *
 * Servicio para sincronizar datos con Google Sheets
 * Usa POST para enviar datos al Google Apps Script (más seguro y eficiente)
 */

export class GoogleSheetsService {
  constructor(sheetId, scriptUrl) {
    this.sheetId = sheetId;
    this.scriptUrl = scriptUrl;
    this.baseUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
    this.syncState = this.loadSyncState();
  }

  /**
   * Cargar estado de sincronización desde localStorage
   */
  loadSyncState() {
    const stored = localStorage.getItem('syncState');
    return stored ? JSON.parse(stored) : {
      lastSync: null,
      lastSyncedRecords: 0,
      syncErrors: []
    };
  }

  /**
   * Guardar estado de sincronización
   */
  saveSyncState() {
    localStorage.setItem('syncState', JSON.stringify(this.syncState));
  }

  /**
   * Obtener datos de una hoja específica
   * Nota: Requiere que la hoja esté compartida públicamente
   */
  async getSheetData(sheetName) {
    try {
      // URL para obtener datos en formato CSV
      const csvUrl = `${this.baseUrl}/export?format=csv&gid=0`;

      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`No se pudo acceder a la hoja: ${response.statusText}`);
      }

      const csvText = await response.text();
      return this.parseCSV(csvText);
    } catch (error) {
      console.error('❌ Error obteniendo datos de Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Parsear CSV simple
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  }

  /**
   * Sincronizar datos a Google Sheets vía POST
   */
  async syncToSheet(dbAdapter) {
  try {
    console.log('🔄 Iniciando sincronización con Google Sheets...');

    const historialPesos = await dbAdapter.obtenerTodos('historialPesos');

    if (historialPesos.length === 0) {
      console.log('ℹ️ No hay datos para sincronizar');
      return { recordsSynced: 0, timestamp: new Date().toISOString() };
    }

    // Ordenar por fecha para mantener el orden cronológico
    const historialOrdenado = historialPesos.sort((a, b) =>
      new Date(a.fecha) - new Date(b.fecha)
    );

    const datosAEnviar = historialOrdenado.map(record => ({
      fecha: record.fecha || new Date().toISOString().split('T')[0],
      ejercicio: record.ejercicio || 'Sin nombre',
      peso: record.peso || 0,
      series: record.series || 0,
      reps: record.reps || 0,
      notas: record.notas || ''
    }));

    // ⭐ NUEVO LOG
    console.log('🔍 datosAEnviar:', JSON.stringify(datosAEnviar, null, 2));
    console.log('📊 Primer registro:', datosAEnviar[0]);
    // ⭐ FIN NUEVO LOG

    console.log(`📤 Enviando ${datosAEnviar.length} registros a Google Sheets...`);

    // Enviar cada registro por separado
    for (const record of datosAEnviar) {
      const formData = new FormData();
      formData.append('fecha', record.fecha);
      formData.append('ejercicio', record.ejercicio);
      formData.append('peso', record.peso);
      formData.append('series', record.series);
      formData.append('reps', record.reps);
      formData.append('notas', record.notas);

      await fetch(this.scriptUrl, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });
    }

    localStorage.setItem('lastSyncedData', JSON.stringify(datosAEnviar));
    this.syncState.lastSync = new Date().toISOString();
    this.syncState.lastSyncedRecords = datosAEnviar.length;
    this.syncState.syncErrors = [];
    this.saveSyncState();

    console.log(`✅ Sincronización completada: ${datosAEnviar.length} registros`);

    return {
      recordsSynced: datosAEnviar.length,
      timestamp: this.syncState.lastSync,
      data: datosAEnviar
    };

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    this.syncState.syncErrors.push({
      timestamp: new Date().toISOString(),
      error: error.message
    });
    this.saveSyncState();
    throw error;
  }
}

  /**
   * Leer el historial guardado en la hoja de Google Sheets (vía Apps Script, JSONP)
   */
  obtenerHistorialDeSheet() {
    return new Promise((resolve, reject) => {
      const callbackName = `sheetsCb_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const params = new URLSearchParams({
        action: 'obtenerHistorial',
        callback: callbackName
      });

      const script = document.createElement('script');

      const cleanup = () => {
        clearTimeout(timer);
        delete window[callbackName];
        script.remove();
      };

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Tiempo de espera agotado al leer el backup.'));
      }, 30000);

      window[callbackName] = (data) => {
        cleanup();
        if (data && data.success) {
          resolve(data.registros || []);
        } else {
          reject(new Error((data && data.error) || 'No se pudo leer el backup'));
        }
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('No se pudo conectar con Google Apps Script.'));
      };

      script.src = `${this.scriptUrl}?${params.toString()}`;
      document.head.appendChild(script);
    });
  }

  /**
   * Restaurar datos desde Google Sheets.
   * Lee la hoja, descarta duplicados (la sincronización agrega todo el
   * historial cada vez) y omite lo que el dispositivo ya tiene.
   */
  async restoreFromSheet(dbAdapter) {
    try {
      console.log('📥 Iniciando restauración desde Google Sheets...');

      const registros = await this.obtenerHistorialDeSheet();
      if (registros.length === 0) {
        throw new Error('No hay backup disponible en Google Sheets. Primero usa "Sincronizar Ahora" en el dispositivo que tiene los datos.');
      }

      // Cada serie tiene su propia marca de tiempo, así que fecha (al segundo) +
      // ejercicio + peso identifica un registro. No se usan reps/series porque la
      // hoja las guarda como número ("8-10" pasa a 8) y no coincidirían.
      const claveDe = (r) =>
        [String(r.fecha).slice(0, 19), r.ejercicio, Number(r.peso)].join('|');

      // Claves de lo que ya existe en este dispositivo
      const existentes = await dbAdapter.obtenerTodos('historialPesos');
      const vistas = new Set(existentes.map(claveDe));

      let importados = 0;
      for (const record of registros) {
        const clave = claveDe(record);
        if (vistas.has(clave)) continue;
        vistas.add(clave);

        await dbAdapter.escribirDocumento('historialPesos', {
          ...record,
          id: `restore-${clave}`   // determinista: restaurar dos veces no duplica
        });
        importados++;
      }

      console.log(`✅ Restauración completada: ${importados} nuevos de ${registros.length} en la hoja`);

      return {
        recordsRestored: importados,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error en restauración:', error);
      throw error;
    }
  }

  /**
   * Verificar si la hoja es accesible
   */
  async isAccessible() {
    try {
      const response = await fetch(
        `${this.baseUrl}/export?format=csv&gid=0`,
        { method: 'HEAD' }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Obtener estado de sincronización
   */
  getSyncStatus() {
    return {
      ...this.syncState,
      sheetId: this.sheetId,
      sheetUrl: this.baseUrl,
      scriptUrl: this.scriptUrl
    };
  }
}
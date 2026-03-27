// ── Candy Studio: IndexedDB Cache ──
// Persistent image/video caching via IndexedDB

(function() {
  window.CS = window.CS || {};

  function openDB() {
    return new Promise((ok, no) => {
      const r = indexedDB.open(CS.DB_NAME, CS.DB_VER);
      r.onupgradeneeded = () => r.result.createObjectStore(CS.STORE);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => no(r.error);
    });
  }

  CS.dbPut = async function(id, blob) {
    try { const db = await openDB(); const tx = db.transaction(CS.STORE, 'readwrite'); tx.objectStore(CS.STORE).put(blob, id); await new Promise(r => { tx.oncomplete = r; }); db.close(); } catch {}
  };

  CS.dbGet = async function(id) {
    try { const db = await openDB(); const tx = db.transaction(CS.STORE, 'readonly'); const req = tx.objectStore(CS.STORE).get(id); return new Promise(r => { req.onsuccess = () => { db.close(); r(req.result); }; req.onerror = () => { db.close(); r(null); }; }); } catch { return null; }
  };

  CS.dbDel = async function(id) {
    try { const db = await openDB(); const tx = db.transaction(CS.STORE, 'readwrite'); tx.objectStore(CS.STORE).delete(id); await new Promise(r => { tx.oncomplete = r; }); db.close(); } catch {}
  };

  CS.dbClear = async function() {
    try { const db = await openDB(); const tx = db.transaction(CS.STORE, 'readwrite'); tx.objectStore(CS.STORE).clear(); await new Promise(r => { tx.oncomplete = r; }); db.close(); } catch {}
  };
})();

// localStorage yang aman: bisa kosong/dilarang (mode privat), jangan sampai crash.
const P = 'menara.';
export const store = {
  get(k, d) {
    try { const v = localStorage.getItem(P + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
  },
  set(k, v) {
    try { localStorage.setItem(P + k, JSON.stringify(v)); return true; } catch (e) { return false; }
  },
  del(k) {
    try { localStorage.removeItem(P + k); } catch (e) { /* abaikan */ }
  }
};

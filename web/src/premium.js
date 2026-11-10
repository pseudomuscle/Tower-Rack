// Premium "Hapus iklan": sekali beli lewat Google Play Billing.
// Pembeli bisa revive langsung tanpa menonton iklan, selamanya.
// Hanya ada di aplikasi Android; di browser fitur ini disembunyikan.
//
// Produk dibuat di Play Console → Monetisasi → Produk dalam aplikasi,
// dengan ID produk PREMIUM_ID di bawah (harus sama persis).
import { isNative } from './native.js';
import { store } from './storage.js';

export const PREMIUM_ID = 'hapus_iklan';
const KEY = 'premium';
const PURCHASED = '1', PENDING = '2'; // Purchase.PurchaseState Google Play

let NP = null, TYPE = null, supported = false, price = null;
const listeners = new Set();

export const isPremium = () => store.get(KEY, false) === true;
export const premiumAvailable = () => isNative && supported;
export const premiumPrice = () => price;
export const onPremiumChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
function setPremium(on) {
  if (isPremium() === on) return;
  store.set(KEY, on);
  listeners.forEach((fn) => fn(on));
}
const owns = (t) => t && t.productIdentifier === PREMIUM_ID && (t.purchaseState === undefined || t.purchaseState === PURCHASED);

/** Siapkan billing: cek dukungan, ambil harga, cocokkan status pembelian. */
export async function initPremium() {
  if (!isNative) return false;
  try {
    const m = await import('@capgo/native-purchases');
    NP = m.NativePurchases; TYPE = m.PURCHASE_TYPE.INAPP;
    supported = (await NP.isBillingSupported()).isBillingSupported;
    if (!supported) return false;
    // pembelian tertunda (mis. bayar di minimarket) yang selesai belakangan
    NP.addListener('transactionUpdated', (t) => { if (owns(t)) setPremium(true); });
    try {
      const { products } = await NP.getProducts({ productIdentifiers: [PREMIUM_ID], productType: TYPE });
      price = products[0]?.priceString || null;
    } catch (e) { price = null; }
    await restorePremium({ revoke: true });
    listeners.forEach((fn) => fn(isPremium()));
    return true;
  } catch (e) {
    supported = false;
    return false;
  }
}

/**
 * Beli Premium. Hasil: 'ok' | 'pending' | 'cancelled' | 'error'.
 */
export async function buyPremium() {
  if (!premiumAvailable()) return 'error';
  try {
    const t = await NP.purchaseProduct({ productIdentifier: PREMIUM_ID, productType: TYPE });
    if (t?.purchaseState === PENDING) return 'pending';
    if (owns(t)) { setPremium(true); return 'ok'; }
    return 'error';
  } catch (e) {
    const msg = String(e?.message || e).toLowerCase();
    if (msg.includes('cancel')) return 'cancelled';
    if (msg.includes('already') || msg.includes('owned')) { await restorePremium(); return isPremium() ? 'ok' : 'error'; }
    return 'error';
  }
}

/**
 * Cocokkan dengan pembelian di akun Google Play. Dengan `revoke`, Premium
 * dicabut bila pembelian sudah tidak ada (mis. dana dikembalikan).
 * Mengembalikan true jika Premium dimiliki.
 */
export async function restorePremium({ revoke = false } = {}) {
  if (!premiumAvailable()) return isPremium();
  try {
    const { purchases } = await NP.getPurchases({ productType: TYPE });
    const owned = (purchases || []).some(owns);
    if (owned) setPremium(true);
    else if (revoke) setPremium(false);
    return owned;
  } catch (e) {
    return isPremium(); // gagal cek (mis. tanpa internet): jangan ubah status
  }
}

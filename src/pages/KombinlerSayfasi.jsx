import { useEffect, useState } from 'react';

import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import { paraBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import AramaKutusu from '../components/AramaKutusu';
import OnayPenceresi from '../components/OnayPenceresi';

import './KombinlerSayfasi.css';

import { Layers, Pencil, Plus, Trash2, X } from 'lucide-react';

const BOS_FORM = { ad: '', aciklama: '', indirimYuzdesi: 10, aktifMi: true, urunIdleri: [] };

export default function KombinlerSayfasi() {
  const [kombinler, setKombinler] = useState([]);
  const [urunler, setUrunler] = useState([]);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');
  const [tazele, setTazele] = useState(0);

  // null = form kapalı, 0 = yeni, >0 = düzenlenen kombin
  const [formId, setFormId] = useState(null);
  const [form, setForm] = useState(BOS_FORM);
  const [urunArama, setUrunArama] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const [silinecek, setSilinecek] = useState(null);

  useEffect(() => {
    let iptal = false;

    (async () => {
      setYukleniyor(true);
      setHata('');

      try {
        const [k, u] = await Promise.all([
          apiGet('/admin/kombinler'),
          apiGet('/products'),
        ]);

        if (iptal) return;
        setKombinler(k);
        setUrunler(u);
      } catch (e) {
        if (!iptal) setHata(e.message);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    })();

    return () => { iptal = true; };
  }, [tazele]);

  function formuAc(kombin) {
    if (kombin) {
      setFormId(kombin.id);
      setForm({
        ad: kombin.ad,
        aciklama: kombin.aciklama ?? '',
        indirimYuzdesi: kombin.indirimYuzdesi,
        aktifMi: kombin.aktifMi,
        urunIdleri: kombin.urunler.map((u) => u.id),
      });
    } else {
      setFormId(0);
      setForm(BOS_FORM);
    }

    setUrunArama('');
    setHata('');
    setBasari('');
  }

  function urunSec(id) {
    setForm((o) => ({
      ...o,
      urunIdleri: o.urunIdleri.includes(id)
        ? o.urunIdleri.filter((x) => x !== id)
        : [...o.urunIdleri, id],
    }));
  }

  async function kaydet() {
    setKaydediliyor(true);
    setHata('');

    try {
      const govde = {
        ad: form.ad,
        aciklama: form.aciklama || null,
        indirimYuzdesi: Number(form.indirimYuzdesi),
        aktifMi: form.aktifMi,
        urunIdleri: form.urunIdleri,
      };

      const cevap = formId === 0
        ? await apiPost('/admin/kombinler', govde)
        : await apiPut('/admin/kombinler/' + formId, govde);

      setBasari(cevap.mesaj);
      setFormId(null);
      setTazele((n) => n + 1);
    } catch (e) {
      setHata(e.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  async function sil(kombin) {
    setSilinecek(null);
    setHata('');

    try {
      const cevap = await apiDelete('/admin/kombinler/' + kombin.id);
      setBasari(cevap.mesaj);
      setTazele((n) => n + 1);
    } catch (e) {
      setHata(e.message);
    }
  }

  if (yukleniyor) {
    return <Yukleniyor yazi="Kombinler getiriliyor..." />;
  }

  // Seçili ürünlerin toplamı ve indirimli tutar — adminin ne
  // sattığını görmeden kaydetmemesi için.
  const secilenler = urunler.filter((u) => form.urunIdleri.includes(u.id));
  const normalToplam = secilenler.reduce((t, u) => t + u.price, 0);
  const tasarruf = Math.round(normalToplam * Number(form.indirimYuzdesi || 0)) / 100;

  const listelenen = urunArama
    ? urunler.filter((u) => u.name.toLowerCase().includes(urunArama.toLowerCase()))
    : urunler.slice(0, 30);

  return (
    <div>
      <div className="sayfa-ust">
        <div>
          <h1 className="sayfa-baslik">Kombinler</h1>
          <p className="sayfa-altyazi">
            Birlikte satılan ürün setleri. İndirim, setin tamamı sepette olduğunda uygulanır.
          </p>
        </div>

        {formId === null && (
          <Buton onClick={() => formuAc(null)}>
            <Plus size={15} /> Yeni Kombin
          </Buton>
        )}
      </div>

      {hata && <HataKutusu mesaj={hata} />}
      {basari && <div className="kombin-basari">{basari}</div>}

      {/* ---------- FORM ---------- */}
      {formId !== null && (
        <div className="kart kombin-form">
          <div className="kombin-form-ust">
            <b>{formId === 0 ? 'Yeni Kombin' : 'Kombini Düzenle'}</b>
            <button type="button" className="kombin-kapat" onClick={() => setFormId(null)}>
              <X size={16} />
            </button>
          </div>

          <div className="kombin-alanlar">
            <label className="kombin-alan">
              <span>Kombin adı</span>
              <input
                type="text"
                value={form.ad}
                onChange={(e) => setForm((o) => ({ ...o, ad: e.target.value }))}
                placeholder="Koşu Seti"
                maxLength={100}
              />
            </label>

            <label className="kombin-alan">
              <span>Açıklama (isteğe bağlı)</span>
              <input
                type="text"
                value={form.aciklama}
                onChange={(e) => setForm((o) => ({ ...o, aciklama: e.target.value }))}
                placeholder="Ayakkabı + Çorap"
                maxLength={300}
              />
            </label>

            <label className="kombin-alan kombin-alan-dar">
              <span>İndirim (%)</span>
              <input
                type="number"
                min={0}
                max={50}
                value={form.indirimYuzdesi}
                onChange={(e) => setForm((o) => ({ ...o, indirimYuzdesi: e.target.value }))}
              />
            </label>

            <label className="kombin-onay">
              <input
                type="checkbox"
                checked={form.aktifMi}
                onChange={(e) => setForm((o) => ({ ...o, aktifMi: e.target.checked }))}
              />
              <span>Yayında</span>
            </label>
          </div>

          {/* Ürün seçimi */}
          <div className="kombin-secim">
            <div className="kombin-secim-ust">
              <b>Ürünler ({form.urunIdleri.length})</b>
              <AramaKutusu deger={urunArama} degistir={setUrunArama} ipucu="Ürün ara..." />
            </div>

            <div className="kombin-urun-liste">
              {listelenen.map((u) => {
                const secili = form.urunIdleri.includes(u.id);

                return (
                  <button
                    key={u.id}
                    type="button"
                    className={'kombin-urun' + (secili ? ' kombin-urun-secili' : '')}
                    onClick={() => urunSec(u.id)}
                  >
                    <span className="kombin-urun-ad">{u.name}</span>
                    <span className="kombin-urun-fiyat">{paraBicimle(u.price)}</span>
                  </button>
                );
              })}
            </div>

            {/* Ne satıldığı ve ne kaybedildiği kaydetmeden görünüyor. */}
            {form.urunIdleri.length >= 2 && (
              <div className="kombin-ozet">
                <span>Normal toplam: <b>{paraBicimle(normalToplam)}</b></span>
                <span>Tasarruf: <b>{paraBicimle(tasarruf)}</b></span>
                <span>Kombin fiyatı: <b>{paraBicimle(normalToplam - tasarruf)}</b></span>
              </div>
            )}
          </div>

          <div className="kombin-form-alt">
            <Buton tip="ikincil" onClick={() => setFormId(null)}>Vazgeç</Buton>
            <Buton
              onClick={kaydet}
              disabled={kaydediliyor || form.ad.trim().length < 2 || form.urunIdleri.length < 2}
            >
              {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
            </Buton>
          </div>
        </div>
      )}

      {/* ---------- LİSTE ---------- */}
      {kombinler.length === 0 ? (
        <div className="kombin-bos">
          <Layers size={20} />
          <span>Henüz kombin yok. Ürün detayında yalnızca "birlikte alınanlar" önerisi görünür.</span>
        </div>
      ) : (
        <div className="kombin-liste">
          {kombinler.map((k) => {
            const toplam = k.urunler.reduce((t, u) => t + u.price, 0);
            const tas = Math.round(toplam * k.indirimYuzdesi) / 100;

            return (
              <div key={k.id} className="kart kombin-kart">
                <div className="kombin-kart-ust">
                  <div>
                    <b className="kombin-ad">{k.ad}</b>
                    {!k.aktifMi && <Rozet durum="pasif" />}
                  </div>

                  <div className="kombin-eylem">
                    <Buton tip="ikincil" boyut="kucuk" ikonRengi="ana" onClick={() => formuAc(k)}>
                      <Pencil size={14} /> Düzenle
                    </Buton>
                    <Buton tip="tehlike" boyut="kucuk" onClick={() => setSilinecek(k)}>
                      <Trash2 size={14} />
                    </Buton>
                  </div>
                </div>

                <div className="kombin-urunler">
                  {k.urunler.map((u, i) => (
                    <span key={u.id} className="kombin-parca">
                      {i > 0 && <span className="kombin-arti">+</span>}
                      <span className={u.isActive ? '' : 'kombin-pasif-urun'}>{u.name}</span>
                    </span>
                  ))}
                </div>

                <div className="kombin-fiyat">
                  <span className="kombin-eski">{paraBicimle(toplam)}</span>
                  <b>{paraBicimle(toplam - tas)}</b>
                  <span className="kombin-tasarruf">%{k.indirimYuzdesi} · {paraBicimle(tas)} tasarruf</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OnayPenceresi
        acik={silinecek !== null}
        baslik="Kombin silinsin mi?"
        mesaj={silinecek ? `"${silinecek.ad}" silinecek. Geçmiş siparişlerin indirimi etkilenmez.` : ''}
        onayYazi="Evet, Sil"
        islemdeYazi="Siliniyor..."
        iptal={() => setSilinecek(null)}
        onayla={() => sil(silinecek)}
      />
    </div>
  );
}

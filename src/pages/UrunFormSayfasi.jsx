import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiGet, apiPost, apiPut } from '../services/api';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import ResimYukleyici from '../components/ResimYukleyici';

import './UrunFormSayfasi.css';

export default function UrunFormSayfasi() {
  const { id } = useParams();
  const navigate = useNavigate();

  const duzenlemeMi = Boolean(id);

  const [kategoriler, setKategoriler] = useState([]);
  const [resimler, setResimler] = useState([]);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    categoryId: '',
  });

  // ---------- ÜRÜNÜ ÇEK (resimler dahil) ----------
  // ResimYukleyici her işlemden sonra bunu çağıracak
  async function urunuYenile() {
    const urun = await apiGet('/products/' + id);

    setForm({
      name: urun.name,
      price: String(urun.price),
      stock: String(urun.stock),
      categoryId: String(urun.categoryId),
    });

    setResimler(urun.images || []);
  }

  // ---------- AÇILIŞ ----------
  useEffect(() => {
    async function baslangicVerisi() {
      setYukleniyor(true);
      setHata('');

      try {
        const kategoriVeri = await apiGet('/categories');
        setKategoriler(kategoriVeri);

        if (duzenlemeMi) {
          await urunuYenile();
        }
      } catch (e) {
        setHata(e.message);
      } finally {
        setYukleniyor(false);
      }
    }

    baslangicVerisi();
  }, [id, duzenlemeMi]);

  function alanDegistir(alan, deger) {
    setForm({ ...form, [alan]: deger });
  }

  // ---------- KAYDET ----------
  async function formGonder(e) {
    e.preventDefault();

    setHata('');
    setBasari('');
    setKaydediliyor(true);

    try {
      const govde = {
        name: form.name.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: Number(form.categoryId),
      };

      if (duzenlemeMi) {
        await apiPut('/products/' + id, govde);
        setBasari('Ürün güncellendi. ✅');
      } else {
        // Yeni ürün: backend id döndürüyor
        const cevap = await apiPost('/products', govde);

        // ⭐ ÖNEMLİ: Düzenleme adresine geçiyoruz.
        // Böylece artık bir id'miz var → resim yükleyebiliriz.
        // replace: true → geri tuşuna basınca boş forma dönmesin.
        navigate('/urunler/' + cevap.id + '/duzenle', { replace: true });
        return;
      }
    } catch (e) {
      setHata(e.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  if (yukleniyor) {
    return <Yukleniyor yazi="Form hazırlanıyor..." />;
  }

  return (
    <div>
      <h1 className="sayfa-baslik">
        {duzenlemeMi ? 'Ürünü Düzenle' : 'Yeni Ürün'}
      </h1>

      <p className="sayfa-altyazi">
        {duzenlemeMi
          ? `#${id} numaralı ürünün bilgilerini ve resimlerini yönet`
          : 'Önce ürün bilgilerini kaydet, sonra resimlerini yükle'}
      </p>

      {basari !== '' && <div className="basari-kutusu">{basari}</div>}

      <div className="form-izgara">

        {/* ================= SOL: BİLGİ FORMU ================= */}
        <form className="form-kutu" onSubmit={formGonder}>

        {hata !== '' && (
          <div style={{ marginBottom: 18 }}>
            <HataKutusu mesaj={hata} />
          </div>
        )}

        <div className="form-alan">
          <label className="form-etiket">Ürün Adı</label>

          <input
            className="form-input"
            type="text"
            value={form.name}
            onChange={(e) => alanDegistir('name', e.target.value)}
            placeholder="Örn: Nike Air Max"
            required
            minLength={2}
            maxLength={200}
          />

          <div className="form-ipucu">2-200 karakter arası olmalı.</div>
        </div>

        <div className="form-ikili">
          <div className="form-alan">
            <label className="form-etiket">Fiyat (₺)</label>

            <input
              className="form-input"
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => alanDegistir('price', e.target.value)}
              placeholder="2499.90"
              required
            />
          </div>

          <div className="form-alan">
            <label className="form-etiket">Stok Adedi</label>

            <input
              className="form-input"
              type="number"
              step="1"
              min="0"
              value={form.stock}
              onChange={(e) => alanDegistir('stock', e.target.value)}
              placeholder="25"
              required
            />
          </div>
        </div>

        <div className="form-alan">
          <label className="form-etiket">Kategori</label>

          <select
            className="form-input"
            value={form.categoryId}
            onChange={(e) => alanDegistir('categoryId', e.target.value)}
            required
          >
            <option value="">Kategori seçin...</option>

            {kategoriler.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-butonlar">
          <Buton type="submit" disabled={kaydediliyor}>
            {kaydediliyor
              ? 'Kaydediliyor...'
              : duzenlemeMi
                ? '💾 Bilgileri Güncelle'
                : '➕ Kaydet ve Resim Ekle'}
          </Buton>

          <Buton
            type="button"
            tip="ikincil"
            onClick={() => navigate('/urunler')}
            disabled={kaydediliyor}
          >
            {duzenlemeMi ? 'Listeye Dön' : 'Vazgeç'}
          </Buton>
        </div>
      </form>

      {/* ================= SAĞ: RESİMLER ================= */}
        <div className="form-kutu form-kutu-sag">
          <div className="bolum-baslik-form">🖼️ Ürün Resimleri</div>

        <div className="bolum-altyazi-form">
          İlk yüklenen resim otomatik olarak ana resim olur.
          Değiştirmek için resmin üstüne gelip ⭐ butonuna bas.
        </div>

        {duzenlemeMi ? (
          <ResimYukleyici
            urunId={Number(id)}
            resimler={resimler}
            yenile={urunuYenile}
          />
        ) : (
            <div className="kilitli-bolum">
              🔒 Resim yükleyebilmek için önce ürünü kaydetmelisin.
              <br />
              Kaydettikten sonra bu bölüm otomatik açılacak.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
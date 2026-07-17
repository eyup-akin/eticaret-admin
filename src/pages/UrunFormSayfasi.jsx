import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiGet, apiPost, apiPut, apiYukle } from '../services/api'; // ⭐ apiYukle eklendi
import { paraBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import ResimYukleyici from '../components/ResimYukleyici';
import BekleyenResimler from '../components/BekleyenResimler'; // ⭐ YENİ

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

  // ⭐ YENİ — yeni üründe resimler kaydedilene kadar burada bekler
  const [bekleyenDosyalar, setBekleyenDosyalar] = useState([]);
  const [bekleyenLinkler, setBekleyenLinkler] = useState([]);
  const [yuklemeDurumu, setYuklemeDurumu] = useState('');

  const [form, setForm] = useState({
    name: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    categoryId: '',
  });

  // ---------- ÜRÜNÜ ÇEK (resimler dahil) ----------
  async function urunuYenile() {
    const urun = await apiGet('/products/' + id);

    setForm({
      name: urun.name,
      barcode: urun.barcode || '',
      price: String(urun.price),
      cost: urun.cost != null ? String(urun.cost) : '',
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

  // ---------- CANLI KÂR HESABI ----------
  const fiyatSayi = Number(form.price);
  const maliyetSayi = Number(form.cost);

  const karHesaplanabilir =
    form.price !== '' &&
    form.cost !== '' &&
    !Number.isNaN(fiyatSayi) &&
    !Number.isNaN(maliyetSayi) &&
    fiyatSayi > 0;

  const kar = karHesaplanabilir ? fiyatSayi - maliyetSayi : 0;
  const marj = karHesaplanabilir ? (kar / fiyatSayi) * 100 : 0;

  const karDurum =
    kar > 0 ? 'kar-pozitif' : kar < 0 ? 'kar-negatif' : 'kar-sifir';

  // ---------- BEKLEYEN RESİMLERİ YÜKLE ----------
  // Ürün oluştuktan (id geldikten) sonra çağrılır.
  // Bir resim patlarsa ürünü iptal etmeyiz, atlar devam ederiz.
  async function bekleyenleriYukle(yeniId) {
    const toplam = bekleyenDosyalar.length + bekleyenLinkler.length;
    let sayac = 0;

    for (const dosya of bekleyenDosyalar) {
      sayac++;
      setYuklemeDurumu(`Resimler yükleniyor... (${sayac}/${toplam})`);

      try {
        await apiYukle('/products/' + yeniId + '/images', dosya);
      } catch (e) {
        console.error('Resim yüklenemedi:', dosya.name, e.message);
      }
    }

    for (const link of bekleyenLinkler) {
      sayac++;
      setYuklemeDurumu(`Resimler yükleniyor... (${sayac}/${toplam})`);

      try {
        await apiPost('/products/' + yeniId + '/images/url', { url: link });
      } catch (e) {
        console.error('Link yüklenemedi:', link, e.message);
      }
    }

    setYuklemeDurumu('');
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
        barcode: form.barcode.trim(),
        price: Number(form.price),
        cost: Number(form.cost),
        stock: Number(form.stock),
        categoryId: Number(form.categoryId),
      };

      if (duzenlemeMi) {
        await apiPut('/products/' + id, govde);
        setBasari('Ürün güncellendi. ✅');
      } else {
        // 1) Önce ürünü oluştur, id'yi al
        const cevap = await apiPost('/products', govde);
        const yeniId = cevap.id;

        // 2) Bekleyen resimleri (varsa) o id'ye yükle
        if (bekleyenDosyalar.length + bekleyenLinkler.length > 0) {
          await bekleyenleriYukle(yeniId);
        }

        // 3) Düzenleme ekranına geç — artık resimleri buradan yönetebilir
        navigate('/urunler/' + yeniId + '/duzenle', { replace: true });
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
          : 'Bilgileri doldur, dilersen resimleri de ekle, sonra tek tuşla kaydet'}
      </p>

      {basari !== '' && <div className="basari-kutusu">{basari}</div>}

      {/* Resim yükleme sürüyorsa durumu göster */}
      {yuklemeDurumu !== '' && (
        <div className="basari-kutusu">{yuklemeDurumu}</div>
      )}

      <div className="form-izgara">

        {/* ================= SOL: BİLGİ FORMU ================= */}
        <form className="form-kutu" onSubmit={formGonder}>

          {hata !== '' && (
            <div style={{ marginBottom: 18 }}>
              <HataKutusu mesaj={hata} />
            </div>
          )}

          {/* Ürün Adı */}
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

          {/* Barkod (zorunlu, benzersiz) */}
          <div className="form-alan">
            <label className="form-etiket">Barkod</label>

            <input
              className="form-input"
              type="text"
              value={form.barcode}
              onChange={(e) => alanDegistir('barcode', e.target.value)}
              placeholder="Örn: 8690000000001"
              required
              maxLength={64}
            />

            <div className="form-ipucu">
              Her ürün için benzersiz olmalı. Zorunlu alan.
            </div>
          </div>

          {/* Fiyat | Maliyet */}
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
              <label className="form-etiket">Maliyet (₺)</label>

              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                value={form.cost}
                onChange={(e) => alanDegistir('cost', e.target.value)}
                placeholder="1800.00"
                required
              />
            </div>
          </div>

          {/* Canlı kâr önizlemesi */}
          <div
            className={`kar-onizleme ${karHesaplanabilir ? karDurum : 'kar-bos'}`}
          >
            {karHesaplanabilir ? (
              <>
                <div className="kar-satir">
                  <span className="kar-etiket">Net Kâr (adet başı)</span>
                  <span className="kar-deger">{paraBicimle(kar)}</span>
                </div>

                <div className="kar-satir">
                  <span className="kar-etiket">Kâr Marjı</span>
                  <span className="kar-deger">%{marj.toFixed(1)}</span>
                </div>
              </>
            ) : (
              <span className="kar-bos-yazi">
                Fiyat ve maliyet girince net kâr burada görünecek.
              </span>
            )}
          </div>

          {/* Stok | Kategori */}
          <div className="form-ikili">
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
          </div>

          <div className="form-butonlar">
            <Buton type="submit" disabled={kaydediliyor}>
              {kaydediliyor
                ? 'Kaydediliyor...'
                : duzenlemeMi
                  ? '💾 Bilgileri Güncelle'
                  : '➕ Ürünü Kaydet'}
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
            {duzenlemeMi
              ? 'İlk yüklenen resim otomatik ana resim olur. Değiştirmek için resmin üstüne gelip ⭐ butonuna bas.'
              : 'Resimleri şimdi ekleyebilirsin; ürünü kaydedince otomatik yüklenecekler.'}
          </div>

          {duzenlemeMi ? (
            <ResimYukleyici
              urunId={Number(id)}
              resimler={resimler}
              yenile={urunuYenile}
            />
          ) : (
            <BekleyenResimler
              dosyalar={bekleyenDosyalar}
              setDosyalar={setBekleyenDosyalar}
              linkler={bekleyenLinkler}
              setLinkler={setBekleyenLinkler}
            />
          )}
        </div>

      </div>
    </div>
  );
}
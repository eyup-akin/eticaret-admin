import { useRef, useState } from 'react';

import { apiYukle, apiDelete, apiPut } from '../services/api';
import { resimUrl } from '../utils/resim';

import './ResimYukleyici.css';

// urunId   : resimlerin ekleneceği ürünün id'si
// resimler : mevcut resim listesi [{ id, url, isMain, sortOrder }]
// yenile   : işlem sonrası ürünü tekrar çekmesi için üst bileşenin fonksiyonu
export default function ResimYukleyici({ urunId, resimler, yenile }) {
  const gizliInput = useRef(null); // gizli <input type="file"> etiketine erişim

  const [surukleniyor, setSurukleniyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [durum, setDurum] = useState('');
  const [hata, setHata] = useState('');

  // ---------- YÜKLEME ----------
  async function dosyalariYukle(dosyalar) {
    if (!dosyalar || dosyalar.length === 0) {
      return;
    }

    setYukleniyor(true);
    setHata('');

    // Birden fazla dosya seçildiyse sırayla yükle
    for (let i = 0; i < dosyalar.length; i++) {
      setDurum(`Yükleniyor... (${i + 1}/${dosyalar.length})`);

      try {
        await apiYukle('/products/' + urunId + '/images', dosyalar[i]);
      } catch (e) {
        setHata(dosyalar[i].name + ': ' + e.message);
      }
    }

    setDurum('');
    setYukleniyor(false);

    await yenile(); // listeyi tazele
  }

  // ---------- SÜRÜKLE-BIRAK ----------
  function surukleUzerinde(e) {
    e.preventDefault(); // BU OLMAZSA tarayıcı dosyayı yeni sekmede açar!
    setSurukleniyor(true);
  }

  function surukleCikti(e) {
    e.preventDefault();
    setSurukleniyor(false);
  }

  function birakildi(e) {
    e.preventDefault();
    setSurukleniyor(false);

    dosyalariYukle(e.dataTransfer.files);
  }

  // ---------- SİL / ANA YAP ----------
  async function resmiSil(resimId) {
    setYukleniyor(true);

    try {
      await apiDelete('/products/images/' + resimId);
      await yenile();
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  async function anaYap(resimId) {
    setYukleniyor(true);

    try {
      await apiPut('/products/images/' + resimId + '/main');
      await yenile();
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div>
      {/* ---------- SÜRÜKLE-BIRAK ALANI ---------- */}
      <div
        className={'yukle-alan' + (surukleniyor ? ' yukle-alan-aktif' : '')}
        onClick={() => gizliInput.current.click()}
        onDragOver={surukleUzerinde}
        onDragLeave={surukleCikti}
        onDrop={birakildi}
      >
        <div className="yukle-ikon">📁</div>
        <div className="yukle-yazi">Resimleri buraya sürükle veya tıkla</div>
        <div className="yukle-ipucu">JPG, PNG, WEBP · En fazla 5 MB</div>
      </div>

      {/* Gerçek input gizli — çirkin olduğu için kendi tasarımımızı kullanıyoruz */}
      <input
        ref={gizliInput}
        className="yukle-gizli-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => {
          // Canlı FileList'i HEMEN diziye kopyala. Aksi halde aşağıdaki
          // value='' satırı, yükleme bitmeden listeyi boşaltıp sadece ilk
          // dosyanın yüklenmesine sebep oluyordu.
          const secilenler = Array.from(e.target.files);

          e.target.value = ''; // aynı dosyayı tekrar seçebilmek için sıfırla
          dosyalariYukle(secilenler);
        }}
      />

      {durum !== '' && <div className="yukleme-durumu">{durum}</div>}

      {hata !== '' && (
        <div className="yukleme-durumu" style={{ color: 'var(--hata)' }}>
          ⚠️ {hata}
        </div>
      )}

      {/* ---------- MEVCUT RESİMLER ---------- */}
      {resimler.length === 0 ? (
        <div className="yukleme-durumu">Henüz resim yok.</div>
      ) : (
        <div className="resim-izgara">
          {resimler.map((r) => (
            <div
              key={r.id}
              className={'resim-kutu' + (r.isMain ? ' resim-kutu-ana' : '')}
            >
              <img className="resim-gorsel" src={resimUrl(r.url)} alt="" />

              {r.isMain && <span className="resim-ana-etiket">ANA</span>}

              <div className="resim-katman">
                {!r.isMain && (
                  <button
                    className="resim-mini-buton"
                    type="button"
                    title="Ana resim yap"
                    onClick={() => anaYap(r.id)}
                    disabled={yukleniyor}
                  >
                    ⭐
                  </button>
                )}

                <button
                  className="resim-mini-buton"
                  type="button"
                  title="Sil"
                  onClick={() => resmiSil(r.id)}
                  disabled={yukleniyor}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
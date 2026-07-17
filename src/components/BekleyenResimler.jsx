import { useRef, useEffect, useState } from 'react';

// ResimYukleyici ile aynı stilleri kullanıyoruz (yeni CSS yazmıyoruz)
import './ResimYukleyici.css';

// dosyalar/setDosyalar : seçilen File nesneleri (üst bileşende tutuluyor)
// linkler/setLinkler   : eklenen resim URL'leri
// Bu bileşen SADECE toplar ve önizler — yüklemeyi form, ürün kaydolunca yapar.
export default function BekleyenResimler({
  dosyalar,
  setDosyalar,
  linkler,
  setLinkler,
}) {
  const gizliInput = useRef(null);

  const [surukleniyor, setSurukleniyor] = useState(false);
  const [urlMetni, setUrlMetni] = useState('');

  // Seçilen dosyalar için önizleme adresleri (blob URL).
  // Dizi değiştikçe yeniden üretip eskileri serbest bırakıyoruz ki
  // bellek sızıntısı olmasın.
  const [onizlemeler, setOnizlemeler] = useState([]);

  useEffect(() => {
    const yeni = dosyalar.map((d) => URL.createObjectURL(d));
    setOnizlemeler(yeni);

    // Temizlik: efekt tekrar çalışınca / bileşen kapanınca blob'ları bırak
    return () => {
      yeni.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [dosyalar]);

  function dosyaEkle(secilenler) {
    const gecerli = Array.from(secilenler);
    if (gecerli.length === 0) {
      return;
    }
    setDosyalar([...dosyalar, ...gecerli]);
  }

  function dosyaSil(index) {
    setDosyalar(dosyalar.filter((_, i) => i !== index));
  }

  function linkEkle() {
    const url = urlMetni.trim();
    if (url === '') {
      return;
    }
    setLinkler([...linkler, url]);
    setUrlMetni('');
  }

  function linkSil(index) {
    setLinkler(linkler.filter((_, i) => i !== index));
  }

  // ---------- SÜRÜKLE-BIRAK ----------
  function surukleUzerinde(e) {
    e.preventDefault();
    setSurukleniyor(true);
  }

  function surukleCikti(e) {
    e.preventDefault();
    setSurukleniyor(false);
  }

  function birakildi(e) {
    e.preventDefault();
    setSurukleniyor(false);
    dosyaEkle(e.dataTransfer.files);
  }

  const toplam = dosyalar.length + linkler.length;

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
        <div className="yukle-ipucu">Kaydedince otomatik yüklenecek</div>
      </div>

      <input
        ref={gizliInput}
        className="yukle-gizli-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => {
          const secilenler = Array.from(e.target.files);
          e.target.value = ''; // aynı dosyayı tekrar seçebilmek için sıfırla
          dosyaEkle(secilenler);
        }}
      />

      {/* ---------- LİNK İLE EKLEME ---------- */}
      <div className="link-satir">
        <input
          className="link-input"
          type="text"
          placeholder="veya resim linki yapıştır (https://...)"
          value={urlMetni}
          onChange={(e) => setUrlMetni(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              linkEkle();
            }
          }}
        />

        <button
          className="link-buton"
          type="button"
          onClick={linkEkle}
          disabled={urlMetni.trim() === ''}
        >
          Ekle
        </button>
      </div>

      {/* ---------- ÖNİZLEME ---------- */}
      {toplam === 0 ? (
        <div className="yukleme-durumu">Henüz resim eklenmedi. (isteğe bağlı)</div>
      ) : (
        <>
          <div className="yukleme-durumu">
            {toplam} resim hazır — ürünü kaydedince yüklenecek.
          </div>

          <div className="resim-izgara">
            {/* Önce dosyalar (yükleme sırası: ilk dosya ANA resim olur) */}
            {dosyalar.map((d, i) => (
              <div
                key={'dosya-' + i}
                className={'resim-kutu' + (i === 0 ? ' resim-kutu-ana' : '')}
              >
                <img className="resim-gorsel" src={onizlemeler[i]} alt="" />

                {i === 0 && <span className="resim-ana-etiket">ANA</span>}

                <div className="resim-katman">
                  <button
                    className="resim-mini-buton"
                    type="button"
                    title="Çıkar"
                    onClick={() => dosyaSil(i)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {/* Sonra linkler (dosya yoksa ilk link ANA olur) */}
            {linkler.map((u, i) => (
              <div
                key={'link-' + i}
                className={
                  'resim-kutu' +
                  (dosyalar.length === 0 && i === 0 ? ' resim-kutu-ana' : '')
                }
              >
                <img className="resim-gorsel" src={u} alt="" />

                {dosyalar.length === 0 && i === 0 && (
                  <span className="resim-ana-etiket">ANA</span>
                )}

                <div className="resim-katman">
                  <button
                    className="resim-mini-buton"
                    type="button"
                    title="Çıkar"
                    onClick={() => linkSil(i)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
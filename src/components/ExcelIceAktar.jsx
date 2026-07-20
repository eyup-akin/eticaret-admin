import { useEffect, useRef, useState } from 'react';

import { apiGet, apiYukle } from '../services/api';

import './ExcelIceAktar.css';

// acik            : modal açık mı? (bool)
// kapat           : modalı kapatan fonksiyon (parent'tan gelir)
// iceAktarimBitti : bir iş BAŞARIYLA bitince parent'ın ürün listesini tazelemesi için
export default function ExcelIceAktar({ acik, kapat, iceAktarimBitti }) {
  const gizliInput = useRef(null); // gizli <input type="file"> etiketine erişmek için

  const [dosya, setDosya] = useState(null);            // seçilen .xlsx dosyası
  const [yukleniyor, setYukleniyor] = useState(false); // dosya sunucuya gidiyor mu?
  const [jobId, setJobId] = useState(null);            // backend'in verdiği iş numarası
  const [job, setJob] = useState(null);                // o işin son durumu (polling ile güncellenir)
  const [hata, setHata] = useState('');

  // iceAktarimBitti prop'unu bir ref'te tutuyoruz. Neden? Polling useEffect'i
  // SADECE jobId değişince yeniden kurulmalı. Callback'i doğrudan kullansaydık,
  // effect onu da bağımlılık olarak isterdi ve her render'da yeniden kurulurdu.
  // Ref ile: effect sabit kalır ama her zaman callback'in EN GÜNCEL halini çağırır.
  const iceAktarimBittiRef = useRef(iceAktarimBitti);
  useEffect(() => {
    iceAktarimBittiRef.current = iceAktarimBitti;
  });

  // ---------- HER ŞEYİ SIFIRLA ----------
  function sifirla() {
    setDosya(null);
    setYukleniyor(false);
    setJobId(null);
    setJob(null);
    setHata('');
  }

  // Modal kapanırken durumu temizle ki tekrar açılınca tertemiz başlasın
  function kapatVeTemizle() {
    sifirla();
    kapat();
  }

  // ---------- DOSYA SEÇİMİ ----------
  function dosyaSecildi(e) {
    const secilen = e.target.files[0];
    e.target.value = ''; // aynı dosyayı tekrar seçebilmek için input'u sıfırla

    if (!secilen) {
      return;
    }

    // İstemcide hızlı kontrol (backend zaten tekrar kontrol ediyor — güvenlik orada)
    if (!secilen.name.toLowerCase().endsWith('.xlsx')) {
      setHata('Sadece .xlsx dosyası seçebilirsin.');
      return;
    }

    setHata('');
    setDosya(secilen);
  }

  // ---------- YÜKLEMEYİ BAŞLAT ----------
  async function yuklemeyiBaslat() {
    if (!dosya) {
      return;
    }

    setYukleniyor(true);
    setHata('');

    try {
      // Backend dosyayı alır, bir "iş" oluşturur ve HEMEN jobId döner (arka planda işler).
      const cevap = await apiYukle('/imports/products', dosya);
      setJobId(cevap.jobId); // ← bu satır aşağıdaki polling useEffect'ini tetikler
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // ---------- DURUM SORGULAMA (POLLING) ----------
  // jobId geldiği an başlar. İş "Tamamlandi" ya da "Hata" olana kadar
  // her 1.5 saniyede bir backend'e "ne durumda?" diye sorar.
  useEffect(() => {
    if (!jobId) {
      return;
    }

    let durduruldu = false;      // modal kapanır/unmount olursa sorgulamayı kes
    let zamanlayici;             // aktif setTimeout — temizlikte iptal edeceğiz
    let bittiBildirildi = false; // iceAktarimBitti yalnızca BİR kez çağrılsın

    async function sorgula() {
      try {
        const veri = await apiGet('/imports/' + jobId);

        if (durduruldu) {
          return;
        }

        setJob(veri);

        // İş bitti mi? (iki bitiş durumu: Tamamlandi / Hata)
        if (veri.status === 'Tamamlandi' || veri.status === 'Hata') {
          if (veri.status === 'Tamamlandi' && !bittiBildirildi) {
            bittiBildirildi = true;
            iceAktarimBittiRef.current(); // parent ürün listesini tazelesin
          }
          return; // yeni sorgu ZAMANLAMIYORUZ → polling burada durur
        }
      } catch (e) {
        if (!durduruldu) {
          setHata(e.message);
        }
        return; // hata olursa da dur
      }

      // Henüz bitmediyse 1.5 sn sonra tekrar sor
      if (!durduruldu) {
        zamanlayici = setTimeout(sorgula, 1500);
      }
    }

    // İlk sorguyu 1 sn sonra yap (backend işi kuyruğa alsın, başlasın)
    zamanlayici = setTimeout(sorgula, 1000);

    // TEMİZLİK: modal kapanınca / bileşen unmount olunca zamanlayıcıyı iptal et.
    // Bu olmazsa arka planda sonsuza dek sorgulayan "hayalet" timer kalır.
    return () => {
      durduruldu = true;
      clearTimeout(zamanlayici);
    };
  }, [jobId]);

  // Modal kapalıysa hiçbir şey çizme
  if (!acik) {
    return null;
  }

  // Hangi aşamadayız? (render'ı okunur tutmak için önden hesaplıyoruz)
  const secimAsamasi = jobId === null;
  const isleniyor =
    jobId !== null &&
    (job === null || job.status === 'Bekliyor' || job.status === 'Isleniyor');
  const tamamlandi = job !== null && job.status === 'Tamamlandi';
  const isHata = job !== null && job.status === 'Hata';

  // İlerleme yüzdesi (işlenen / toplam)
  const islenen = job ? job.success + job.failed : 0;
  const yuzde = job && job.total > 0 ? (islenen / job.total) * 100 : 0;

  return (
    // Perdeye tıklanınca kapansın
    <div className="ice-perde" onClick={kapatVeTemizle}>
      {/* İç kutuya tıklama perdeye ULAŞMASIN (yoksa her tıkta kapanırdı) */}
      <div className="ice-kutu" onClick={(e) => e.stopPropagation()}>
        <div className="ice-baslik-satir">
          <h2 className="ice-baslik">📥 Excel ile Ürün İçe Aktar</h2>

          <button
            className="ice-kapat-x"
            type="button"
            onClick={kapatVeTemizle}
          >
            ✕
          </button>
        </div>

        {/* ================= AŞAMA 1: DOSYA SEÇİMİ ================= */}
        {secimAsamasi && (
          <>
            <p className="ice-aciklama">
              Bir <b>.xlsx</b> dosyası seç. Ürünler arka planda eklenir; bu
              pencereyi açık tutarsan ilerlemeyi canlı görürsün.
            </p>

            {/* Kullanıcı hangi sütunları koymalı — küçük ipucu kutusu */}
            <div className="ice-sutun-ipucu">
              <div className="ice-ipucu-baslik">Beklenen sütunlar</div>
              <div>
                <b>Zorunlu:</b> Barkod, Ürün Adı, Fiyat, Kategori
              </div>
              <div>
                <b>İsteğe bağlı:</b> Maliyet, Stok, Resim (resim linki; birden
                çoksa alt alta veya <code>;</code> ile ayır)
              </div>
            </div>

            {/* Dosya seçme alanı — gerçek input gizli, bu kutuya tıklayınca açılır */}
            <div
              className="ice-secim-alan"
              onClick={() => gizliInput.current.click()}
            >
              {dosya ? (
                <div className="ice-dosya-secili">
                  <span className="ice-dosya-ikon">📄</span>
                  <span className="ice-dosya-ad">{dosya.name}</span>
                </div>
              ) : (
                <div className="ice-secim-bos">
                  <div className="ice-secim-ikon">📁</div>
                  <div>Dosya seçmek için tıkla</div>
                  <div className="ice-secim-ipucu">Sadece .xlsx · En fazla 10 MB</div>
                </div>
              )}
            </div>

            <input
              ref={gizliInput}
              className="ice-gizli-input"
              type="file"
              accept=".xlsx"
              onChange={dosyaSecildi}
            />

            {hata !== '' && <div className="ice-hata">⚠️ {hata}</div>}

            <div className="ice-butonlar">
              <button
                className="ice-buton-ikincil"
                type="button"
                onClick={kapatVeTemizle}
              >
                Vazgeç
              </button>

              <button
                className="ice-buton-ana"
                type="button"
                onClick={yuklemeyiBaslat}
                disabled={!dosya || yukleniyor}
              >
                {yukleniyor ? 'Yükleniyor...' : 'İçe Aktarmayı Başlat'}
              </button>
            </div>
          </>
        )}

        {/* ================= AŞAMA 2: İŞLENİYOR ================= */}
        {isleniyor && (
          <div className="ice-durum-alan">
            <div className="ice-spinner" />

            <div className="ice-durum-yazi">
              {job === null || job.status === 'Bekliyor'
                ? 'İş sıraya alındı, birazdan başlıyor...'
                : 'Ürünler ekleniyor, lütfen bekle...'}
            </div>

            {/* İlerleme çubuğu — toplam biliniyorsa göster */}
            {job !== null && job.total > 0 && (
              <div className="ice-ilerleme">
                <div className="ice-ilerleme-yazi">
                  {islenen} / {job.total}
                </div>

                <div className="ice-ilerleme-cizgi">
                  <div
                    className="ice-ilerleme-dolu"
                    style={{ width: yuzde + '%' }}
                  />
                </div>
              </div>
            )}

            <div className="ice-not">
              Bu pencereyi kapatsan da işlem arka planda sürer.
            </div>
          </div>
        )}

        {/* ================= AŞAMA 3: TAMAMLANDI ================= */}
        {tamamlandi && (
          <div className="ice-durum-alan">
            <div className="ice-sonuc-ikon ice-basari-ikon">✓</div>
            <div className="ice-sonuc-baslik">İçe aktarma tamamlandı</div>

            <div className="ice-ozet">
              <div className="ice-ozet-satir">
                <span>Toplam</span>
                <b>{job.total}</b>
              </div>

              <div className="ice-ozet-satir">
                <span>Eklenen</span>
                <b style={{ color: 'var(--basari)' }}>{job.success}</b>
              </div>

              <div className="ice-ozet-satir">
                <span>Atlanan</span>
                <b style={{ color: 'var(--favoriRenk)' }}>{job.failed}</b>
              </div>
            </div>

            {job.failed > 0 && (
              <div className="ice-not">
                Atlanma nedenleri genelde: boş zorunlu alan, geçersiz fiyat ya da
                tekrar eden barkod.
              </div>
            )}

            <div className="ice-butonlar ice-tek-buton">
              <button
                className="ice-buton-ana"
                type="button"
                onClick={kapatVeTemizle}
              >
                Tamam
              </button>
            </div>
          </div>
        )}

        {/* ================= AŞAMA 4: HATA ================= */}
        {isHata && (
          <div className="ice-durum-alan">
            <div className="ice-sonuc-ikon ice-hata-ikon">!</div>
            <div className="ice-sonuc-baslik">İçe aktarma başarısız</div>

            <div className="ice-hata-mesaj">
              {job.errorMessage || 'Bilinmeyen bir hata oluştu.'}
            </div>

            <div className="ice-butonlar ice-tek-buton">
              <button
                className="ice-buton-ikincil"
                type="button"
                onClick={sifirla}
              >
                Yeniden Dene
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
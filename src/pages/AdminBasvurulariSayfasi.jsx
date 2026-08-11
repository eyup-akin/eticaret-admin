import { useEffect, useState } from 'react';

import { apiGet, apiPut } from '../services/api';
import { tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Sayfalama from '../components/Sayfalama';
import Rozet from '../components/Rozet';

import OnayPenceresi from '../components/OnayPenceresi';   // ⭐ YENİ

import './AdminBasvurulariSayfasi.css';
// aliaslı git push denemesi
// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde.
import { Check, FolderOpen, Hourglass, X } from 'lucide-react';

export default function AdminBasvurulariSayfasi() {

  // 'beklemede' veya 'karar'
  //
  // Sekme değeri backend'e doğrudan gönderilmiyor — 'karar' diye bir
  // durum yok. Aşağıda çeviriyoruz. Ekran kavramı ile veri kavramı
  // birebir aynı olmak zorunda değil.
  const [aktifSekme, setAktifSekme] = useState('beklemede');

  const [veri, setVeri] = useState(null);
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  // Hangi başvurunun red formu açık? (başvuru id'si veya null)
  //
  // Neden ayrı bir modal bileşeni yazmadık?
  // Red nedeni metin girdisi istiyor. OnayPenceresi sadece
  // evet/hayır soruyor. Sırf bunun için modal'ı genişletmek yerine
  // kartın içinde açılan bir form kullanıyoruz — hem daha az kod
  // hem kullanıcı hangi başvuruyu reddettiğini gözden kaçırmıyor.
  const [redAcikId, setRedAcikId] = useState(null);
  const [redNedeni, setRedNedeni] = useState('');

  // Şu an hangi başvuru üzerinde işlem sürüyor? (çift tıklama koruması)
  const [islemdekiId, setIslemdekiId] = useState(null);


  // ⭐ YENİ — onay penceresi hangi başvuru için açık?
  //
  // Neden id değil de başvurunun KENDİSİ saklanıyor?
  // Pencerede kişinin adını yazacağız ("Ayşe İzgüt yönetici
  // yapılacak"). Sadece id saklasaydık, adı bulmak için listede
  // arama yapmak gerekirdi — üstelik liste o sırada tazelenip
  // değişmiş olabilirdi.
  //
  // null = pencere kapalı. Bu, "açık mı?" için AYRI bir boolean
  // state tutmaktan iyi: iki state'i senkron tutma derdi yok,
  // tutarsız duruma (açık ama başvuru yok) düşmek imkânsız.
  const [onaylanacak, setOnaylanacak] = useState(null);

  // ---------- VERİYİ ÇEK ----------
  useEffect(() => {
    let iptal = false;

    async function getir() {
      setYukleniyor(true);
      setHata('');

      try {
        // Sekme adını API'nin anladığı durum değerine çeviriyoruz.
        //
        // 'karar' sekmesinde durum parametresi GÖNDERMİYORUZ —
        // backend filtre yoksa hepsini döndürüyor. Bu, "onaylandi
        // VEYA reddedildi" filtresi yazmaktan basit ve API'yi
        // değiştirmeye gerek bırakmıyor.
        const durumParam = aktifSekme === 'beklemede'
          ? '&durum=beklemede'
          : '';

        const cevap = await apiGet(
          '/admin/basvurular?page=' + sayfa +
          '&pageSize=' + sayfaBoyutu +
          durumParam
        );

        if (!iptal) {
          setVeri(cevap);
        }
      } catch (e) {
        if (!iptal) {
          setHata(e.message);
        }
      } finally {
        if (!iptal) {
          setYukleniyor(false);
        }
      }
    }

    getir();

    return () => {
      iptal = true;
    };
  }, [aktifSekme, sayfa, sayfaBoyutu]);

  // Listeyi yeniden çekmek için sayfa numarasına dokunmadan
  // effect'i tetiklemenin bir yolu lazım. En basiti: sayfayı
  // aynı değere set etmek işe YARAMAZ (React aynı değerde render
  // atlar). Bu yüzden bir sayaç kullanıyoruz.
  const [yenile, setYenile] = useState(0);

  useEffect(() => {
    // yenile 0'ken ilk yüklemeyi tekrarlamayalım
    if (yenile === 0) {
      return;
    }

    setSayfa(1);
    setAktifSekme((o) => o); // durum aynı, ama aşağıdaki effect tetiklenir
  }, [yenile]);

  function sekmeDegistir(yeni) {
    setAktifSekme(yeni);
    setSayfa(1);
    setBasari('');
    setRedAcikId(null);
  }

  function boyutDegistir(yeniBoyut) {
    setSayfaBoyutu(yeniBoyut);
    setSayfa(1);
  }

  // Listeyi tazele — işlemden sonra çağrılıyor.
  //
  // sayfaBoyutu'nu kendi değerine set etmek yerine küçük bir
  // "tazeleme" hilesi: sayfayı 1'e alıyoruz. Zaten 1'deysek
  // aşağıdaki setSayfaBoyutu tetikler. Basit ve yeterli.
  async function listeyiTazele() {
    setSayfa(1);
    setSayfaBoyutu((o) => o); // no-op

    try {
      const durumParam = aktifSekme === 'beklemede' ? '&durum=beklemede' : '';

      const cevap = await apiGet(
        '/admin/basvurular?page=1&pageSize=' + sayfaBoyutu + durumParam
      );

      setVeri(cevap);
    } catch (e) {
      setHata(e.message);
    }
  }

  // ---------- ONAYLA ----------
  
  // ---------- ONAYLA ----------
  //
  // ⚠️ window.confirm KULLANMIYORUZ — bilinçli bir değişiklik.
  //
  // Üç sorunu vardı:
  //   1) JavaScript'i BLOKLAR. Kod o satırda durur; arka plandaki
  //      bildirim zili zamanlayıcısı da dahil hiçbir şey çalışmaz.
  //   2) Temaya uymaz. Koyu temada bembeyaz bir kutu çıkar.
  //   3) Projede zaten OnayPenceresi var ve her yerde o kullanılıyor
  //      (ürün silme, sipariş iptali, kullanıcı pasifleştirme).
  //      Tek yerde farklı davranmak tutarsızlıktır.
  //
  // Artık iki parça: pencereyi AÇAN fonksiyon ve onay gelince
  // asıl işi YAPAN fonksiyon.
  function onayPenceresiniAc(basvuru) {
    setHata('');
    setBasari('');
    setOnaylanacak(basvuru);
  }

  async function onayiUygula() {
    // Savunmacı kontrol: pencere kapalıyken bu fonksiyona
    // ulaşılmamalı, ama ulaşılırsa sessizce çıksın.
    if (!onaylanacak) {
      return;
    }

    setIslemdekiId(onaylanacak.id);
    setHata('');
    setBasari('');

    try {
      const cevap = await apiPut(
        '/admin/basvurular/' + onaylanacak.id + '/onayla',
        {}
      );

      setBasari(cevap.mesaj);

      // ⚠️ Pencereyi başarıdan SONRA kapatıyoruz.
      //
      // Önce kapatsaydık ve istek hata verseydi, kullanıcı hata
      // mesajını görür ama neyin başarısız olduğunu bilemezdi —
      // pencere çoktan kaybolmuş olurdu.
      setOnaylanacak(null);

      await listeyiTazele();
    } catch (e) {
      setHata(e.message);

      // Hata durumunda pencere AÇIK kalıyor ki kullanıcı
      // tekrar deneyebilsin.
    } finally {
      setIslemdekiId(null);
    }
  }


  // ---------- REDDET ----------
  async function reddet(basvuru) {
    if (redNedeni.trim().length < 5) {
      setHata('Red nedeni en az 5 karakter olmalı.');
      return;
    }

    setIslemdekiId(basvuru.id);
    setHata('');
    setBasari('');

    try {
      const cevap = await apiPut(
        '/admin/basvurular/' + basvuru.id + '/reddet',
        { redNedeni: redNedeni.trim() }
      );

      setBasari(cevap.mesaj);
      setRedAcikId(null);
      setRedNedeni('');
      await listeyiTazele();
    } catch (e) {
      setHata(e.message);
    } finally {
      setIslemdekiId(null);
    }
  }

  return (
    <div>
      <h1 className="sayfa-baslik">Admin Başvuruları</h1>
      <p className="sayfa-altyazi">
        Yöneticilik başvurularını incele, onayla veya reddet.
      </p>

      {/* ---------- SEKMELER ---------- */}
      {/* Ortak .sekme-serit sınıflarını kullanıyoruz — aynı stiller
          Raporlar ve Ürün formunda da geçerli. */}
      <div className="sekme-serit" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={'sekme' + (aktifSekme === 'beklemede' ? ' sekme-aktif' : '')}
          onClick={() => sekmeDegistir('beklemede')}
        >
          <span className="sekme-ikon"><Hourglass size={16} /></span>
          Bekleyenler

          {/* Sayı sekmenin üstünde: süperadmin sekmeye girmeden
              kaç iş olduğunu görsün. Bu sayı filtreden BAĞIMSIZ
              geliyor (backend ayrı hesaplıyor). */}
          {veri && veri.bekleyenSayisi > 0 && (
            <span className="basvuru-sekme-sayi">{veri.bekleyenSayisi}</span>
          )}
        </button>

        <button
          type="button"
          className={'sekme' + (aktifSekme === 'karar' ? ' sekme-aktif' : '')}
          onClick={() => sekmeDegistir('karar')}
        >
          <span className="sekme-ikon"><FolderOpen size={16} /></span>
          Tüm Başvurular
        </button>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} />}
      {basari !== '' && <div className="basari-kutusu">{basari}</div>}

      {yukleniyor && veri === null && (
        <Yukleniyor yazi="Başvurular yükleniyor..." />
      )}

      {veri && veri.basvurular.length === 0 && (
        <div className="basvuru-bos">
          {aktifSekme === 'beklemede'
            ? 'Bekleyen başvuru yok. Her şey temiz.'
            : 'Henüz hiç başvuru yapılmamış.'}
        </div>
      )}

      {/* ---------- BAŞVURU KARTLARI ---------- */}
      {/*
        Neden tablo değil kart?
        Gerekçe metni 1000 karaktere kadar çıkabiliyor. Tablo
        hücresine sığdırmak için kısaltmak gerekirdi — ama süperadmin
        kararını TAM METNE bakarak veriyor. Kısaltılmış gerekçe,
        kararın dayanağını yok eder.
      */}
      {veri && veri.basvurular.map((b) => (
        <div key={b.id} className="basvuru-kart">

          <div className="basvuru-ust">
            <div>
              <div className="basvuru-ad">{b.basvuran ?? 'Silinmiş kullanıcı'}</div>
              <div className="basvuru-email">{b.basvuranEmail}</div>
            </div>

            <div className="basvuru-ust-sag">
              <Rozet durum={b.durum} />
              <div className="basvuru-tarih">{tarihBicimle(b.tarih)}</div>
            </div>
          </div>

          <div className="basvuru-gerekce">{b.gerekce}</div>

          {/* Karar verilmişse kimin verdiğini göster.
              Denetim için kritik: "bu kişiyi kim admin yaptı?" */}
          {b.kararTarihi && (
            <div className="basvuru-karar">
              <b>{b.kararVeren ?? 'Bilinmeyen'}</b> tarafından{' '}
              {tarihBicimle(b.kararTarihi)} tarihinde karara bağlandı.
              {b.redNedeni && (
                <div className="basvuru-red-nedeni">
                  <b>Gerekçe:</b> {b.redNedeni}
                </div>
              )}
            </div>
          )}

          {/* Butonlar SADECE bekleyen başvurularda.
              Karar verilmiş bir başvuruda "Onayla" göstermek
              tıklanabilir bir yalan olurdu — backend zaten
              reddederdi. */}
          {b.durum === 'beklemede' && (
            <div className="basvuru-butonlar">
              <button
                type="button"
                className="basvuru-onay-buton"
                onClick={() => onayPenceresiniAc(b)}
                disabled={islemdekiId === b.id}
              >
                {islemdekiId === b.id ? 'İşleniyor...' : <><Check size={15} /> Onayla</>}
              </button>

              <button
                type="button"
                className="basvuru-red-buton"
                onClick={() => {
                  setRedAcikId(redAcikId === b.id ? null : b.id);
                  setRedNedeni('');
                }}
                disabled={islemdekiId === b.id}
              >
                <X size={15} /> Reddet
              </button>
            </div>
          )}

          {/* Red formu — sadece o kart için açılıyor */}
          {redAcikId === b.id && (
            <div className="basvuru-red-form">
              <label className="basvuru-red-etiket">
                Red nedeni (başvurana e-posta ile gönderilecek)
              </label>

              <textarea
                className="basvuru-red-alan"
                value={redNedeni}
                onChange={(e) => setRedNedeni(e.target.value)}
                placeholder="Örn: Şu an ek yönetici ihtiyacımız bulunmuyor."
                rows={3}
                maxLength={500}
              />

              <div className="basvuru-red-form-butonlar">
                <button
                  type="button"
                  className="basvuru-red-buton"
                  onClick={() => reddet(b)}
                  disabled={islemdekiId === b.id}
                >
                  {islemdekiId === b.id ? 'Gönderiliyor...' : 'Reddi Onayla'}
                </button>

                <button
                  type="button"
                  className="basvuru-vazgec-buton"
                  onClick={() => {
                    setRedAcikId(null);
                    setRedNedeni('');
                  }}
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {veri && veri.toplamSayfa > 1 && (
        <Sayfalama
          sayfa={veri.sayfa}
          toplamSayfa={veri.toplamSayfa}
          toplam={veri.toplam}
          sayfaBoyutu={veri.sayfaBoyutu}
          sayfaDegistir={setSayfa}
          boyutDegistir={boyutDegistir}
        />
      )}


      {/* ⭐ YENİ — ONAY PENCERESİ
      
          Neden reddetme için de modal kullanmıyoruz?
          Reddetme METİN GİRDİSİ istiyor (red nedeni), OnayPenceresi
          ise sadece evet/hayır soruyor. Sırf bunun için bileşene
          textarea desteği eklemek, tek bir çağrı uğruna paylaşılan
          bir bileşeni karmaşıklaştırmak olurdu.
          
          "Bir kere gereken şey için soyutlama değiştirilmez."
          Kart içindeki form hem daha az kod hem de kullanıcı hangi
          başvuruyu reddettiğini gözden kaçırmıyor — modal açılsaydı
          arkadaki kart perdelenirdi.
          
          ⚠️ onayTipi="ana" (mavi), "tehlike" (kırmızı) DEĞİL.
          Kırmızı "geri alınamaz" demek. Yetki vermek geri
          alınabilir bir işlem: Kullanıcılar sayfasından rolü
          düşürmek yeterli. Her onayı kırmızı yapmak, gerçekten
          tehlikeli işlemlerin uyarı gücünü zayıflatır. */}
      <OnayPenceresi
        acik={onaylanacak !== null}
        baslik="Yöneticilik onayı"
        mesaj={
          onaylanacak
            ? onaylanacak.basvuran +
              ' yönetici yetkisi alacak. Mevcut oturumları sonlandırılacak ve ' +
              'kendisine bilgilendirme e-postası gönderilecek.'
            : ''
        }
        onayla={onayiUygula}
        iptal={() => setOnaylanacak(null)}
        islemde={islemdekiId === onaylanacak?.id}
        onayYazi="Evet, Yönetici Yap"
        islemdeYazi="Onaylanıyor..."
        onayTipi="ana"
      />

    </div>
  );
}
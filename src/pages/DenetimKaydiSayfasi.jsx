import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGet } from '../services/api';
import { tarihBicimle } from '../utils/bicimlendir';

import TarihAraligi from '../components/TarihAraligi';
import AramaKutusu from '../components/AramaKutusu';
import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Tablo from '../components/Tablo';
import Sayfalama from '../components/Sayfalama';

import './DenetimKaydiSayfasi.css';

// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde.
import { Search } from 'lucide-react';

// ============================================================
//  DENETİM KAYDI
//
//  "Kim, kimi, ne zaman, ne yaptı?"
//
//  AuditLog tablosu uzun süredir doluyordu ama okunacak bir
//  ekranı yoktu. Kayıt tutup hiç okumamak, kayıt tutmamakla
//  aynı şeydir.
//
//  ⚠️ SADECE SÜPERADMİN. Rota tarafında KorumaliRota,
//  sunucu tarafında [Authorize(Roles = "superadmin")] var.
//  Menüden gizlemek üçüncü katman — ama tek başına güvenlik
//  değil, sadece kullanıcıyı yanlış yere göndermeme nezaketi.
// ============================================================

// İşlem kodlarının okunabilir karşılıkları ve renkleri.
//
// NEDEN BACKEND'DE DEĞİL DE BURADA?
// Bu bir SUNUM meselesi. Backend "rol_degisti" diyor — bu bir
// makine kodu, sabit ve güvenilir. Ekranda ne yazacağı ise
// arayüzün kararı: yarın "Yetki Değişikliği" demek istersek
// API sözleşmesine dokunmamış oluruz.
//
// Rozet bileşeninde de aynı deseni kullandık.
const ISLEM_BILGI = {
  rol_degisti:      { yazi: 'Rol Değişti',      renk: '#8e44ad' },
  pasiflestirildi:  { yazi: 'Pasifleştirildi',  renk: '#e74c3c' },
  aktiflestirildi:  { yazi: 'Aktifleştirildi',  renk: '#27ae60' },
  yorum_gizlendi:   { yazi: 'Yorum Gizlendi',   renk: '#f39c12' },
  yorum_gosterildi: { yazi: 'Yorum Gösterildi', renk: '#2563eb' },
};

// Sözlükte olmayan bir kod gelirse ne olacak?
//
// Backend'e yeni bir Action eklenip buraya karşılığı yazılmazsa
// ekran ÇÖKMEMELİ. Ham kodu gösterip nötr bir renk veriyoruz —
// çirkin ama çalışıyor ve eksikliği hemen görünüyor.
function islemBilgisi(kod) {
  return ISLEM_BILGI[kod] ?? { yazi: kod, renk: '#64748b' };
}

export default function DenetimKaydiSayfasi() {
  const navigate = useNavigate();

  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // Filtreler
  const [arama, setArama] = useState('');
  const [islemFiltre, setIslemFiltre] = useState('');
  const [baslangic, setBaslangic] = useState('');
  const [bitis, setBitis] = useState('');

  // Sayfalama
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(20);

  async function getir() {
    setYukleniyor(true);
    setHata('');

    try {
      const p = new URLSearchParams();

      if (arama.trim() !== '') {
        p.append('arama', arama.trim());
      }

      if (islemFiltre !== '') {
        p.append('islem', islemFiltre);
      }

      if (baslangic !== '') {
        p.append('baslangic', baslangic);
      }

      if (bitis !== '') {
        p.append('bitis', bitis);
      }

      p.append('page', sayfa);
      p.append('pageSize', sayfaBoyutu);

      setVeri(await apiGet('/admin/audit-logs?' + p.toString()));
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // ⚠️ DEBOUNCE — arama kutusuna her harfte istek atmayalım.
  //
  // "Ahmet" yazan kullanıcı 5 istek tetiklerdi ve cevaplar
  // sırasız dönerse ekranda yanlış sonuç kalabilirdi.
  // 400ms bekleyip son halini gönderiyoruz.
  //
  // return () => clearTimeout(...): temizlik fonksiyonu.
  // Kullanıcı 400ms dolmadan bir harf daha yazarsa önceki
  // zamanlayıcı iptal edilir. Bu satır olmasaydı her harf için
  // bir zamanlayıcı birikir ve hepsi ayrı istek atardı.
  useEffect(() => {
    const sayac = setTimeout(() => {
      getir();
    }, 400);

    return () => clearTimeout(sayac);
  }, [arama, islemFiltre, baslangic, bitis, sayfa, sayfaBoyutu]);

  // Filtre değişince 1. sayfaya dön.
  //
  // Neden ayrı bir effect? Kullanıcı 5. sayfadayken filtre
  // uygularsa, yeni sonuç 2 sayfa olabilir ve 5. sayfa boş
  // çıkardı — "sonuç yok" sanırdı.
  //
  // ⚠️ Bağımlılık listesinde "sayfa" YOK: olsaydı sayfa
  // değiştirmek sayfayı 1'e döndürür, sonsuz döngü olurdu.
  useEffect(() => {
    setSayfa(1);
  }, [arama, islemFiltre, baslangic, bitis, sayfaBoyutu]);

  const sutunlar = [
    {
      baslik: 'İşlem',
      hucre: (l) => {
        const bilgi = islemBilgisi(l.islem);

        return (
          <span
            className="denetim-etiket"
            style={{
              // Renk BİLGİ taşıyor: pasifleştirme kırmızı
              // (yıkıcı), aktifleştirme yeşil (onarıcı), rol
              // değişikliği mor (yetki). Hepsini gri yapmak
              // bilgi kaybı olurdu.
              //
              // Sondaki '22' hex saydamlık: %13 opaklık.
              backgroundColor: bilgi.renk + '22',
              color: bilgi.renk,
            }}
          >
            {bilgi.yazi}
          </span>
        );
      },
    },
    {
      baslik: 'Kim Yaptı',

      // Adı tıklanabilir yapıyoruz: denetim kaydına bakan kişi
      // "bu admin başka ne yapmış" diye merak eder. Müşteri
      // detay sayfası o kişinin kendi log listesini zaten
      // gösteriyor.
      hucre: (l) => (
        <button
          className="denetim-kisi-link"
          onClick={() => navigate('/kullanicilar/' + l.yapanId)}
        >
          {l.yapan}
        </button>
      ),
    },
    {
      baslik: 'Kime',
      hucre: (l) => (
        <button
          className="denetim-kisi-link"
          onClick={() => navigate('/kullanicilar/' + l.hedefId)}
        >
          {l.hedef}
        </button>
      ),
    },
    {
      baslik: 'Değişiklik',

      // Eski → yeni akışı tek hücrede. İki ayrı sütun
      // yapsaydık tablo genişler, göz ikisini eşleştirmek
      // için sağa sola gider ve ilişki kaybolurdu.
      hucre: (l) => {
        // Her ikisi de boşsa bu bir "değer değişikliği" değil,
        // bir olaydır (yorum gizleme gibi). Boş hücre bırakmak
        // yerine tire koyuyoruz.
        if (!l.eski && !l.yeni) {
          return <span className="denetim-bos">—</span>;
        }

        return (
          <span className="denetim-degisim">
            <span className="denetim-eski">{l.eski || '—'}</span>
            <span className="denetim-ok"> → </span>
            <span className="denetim-yeni">{l.yeni || '—'}</span>
          </span>
        );
      },
    },
    {
      baslik: 'Ne Zaman',
      hucre: (l) => tarihBicimle(l.tarih),
    },
  ];

  return (
    <div>
      <div className="sayfa-ust">
        <h1 className="sayfa-baslik"><Search size={20} /> Denetim Kaydı</h1>

        <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
          Yetki değişiklikleri, hesap işlemleri ve moderasyon
          hareketlerinin kalıcı kaydı
        </p>
      </div>

      <TarihAraligi
        baslangic={baslangic}
        bitis={bitis}
        degistir={(yeniBas, yeniBit) => {
          setBaslangic(yeniBas);
          setBitis(yeniBit);
        }}
      />

      {/* ================= FİLTRELER ================= */}
      <div className="filtre-cubugu">
        <div className="filtre-grup" style={{ flex: 1, minWidth: 220 }}>
          <span className="filtre-etiket">Ara</span>

          <AramaKutusu
            deger={arama}
            degistir={setArama}
            ipucu="İşlemi yapan veya işlem yapılan kişi..."
          />
        </div>

        <div className="filtre-grup">
          <span className="filtre-etiket">İşlem Tipi</span>

          {/* ⭐ Seçenekler SUNUCUDAN geliyor, sabit liste değil.
              Backend'e yeni bir işlem tipi eklendiğinde bu menü
              kendiliğinden büyür — güncellemeyi unutmak imkânsız. */}
          <select
            className="filtre-secim"
            value={islemFiltre}
            onChange={(e) => setIslemFiltre(e.target.value)}
          >
            <option value="">Tümü</option>

            {(veri?.islemTipleri ?? []).map((kod) => (
              <option key={kod} value={kod}>
                {islemBilgisi(kod).yazi}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={getir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Denetim kayıtları getiriliyor..." />
      ) : (
        <>
          <div className="rapor-bilgi">
            <span>
              Dönem: <b>{veri?.baslangic}</b> – <b>{veri?.bitis}</b>
            </span>

            <span>
              Bu kayıtlar <b>silinmez ve değiştirilemez</b>. Denetim
              izinin değeri, güvenilir olmasından gelir.
            </span>
          </div>

          <Tablo
            sutunlar={sutunlar}
            veriler={veri?.loglar ?? []}
            anahtar={(l) => l.Id}
            bosMesaj="Bu filtreye uyan denetim kaydı yok."
          />

          <Sayfalama
            sayfa={sayfa}
            toplamSayfa={veri?.toplamSayfa ?? 1}
            toplam={veri?.toplam ?? 0}
            sayfaBoyutu={sayfaBoyutu}
            sayfaDegistir={setSayfa}
            boyutDegistir={setSayfaBoyutu}
          />
        </>
      )}
    </div>
  );
}
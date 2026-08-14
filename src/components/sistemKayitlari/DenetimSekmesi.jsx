import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGet } from '../../services/api';
import { tarihBicimle } from '../../utils/bicimlendir';

import AramaKutusu from '../AramaKutusu';
import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';
import Sayfalama from '../Sayfalama';

import DegerGosterimi from './DegerGosterimi';

// ============================================================
//  DENETİM SEKMESİ — "kim, kimi/neyi, ne zaman, ne yaptı?"
//
//  ⭐ DEĞİŞTİ — eskiden ayrı bir sayfaydı (DenetimKaydiSayfasi).
//  Sistem Kayıtları menüsünün ilk sekmesi oldu: süperadmin
//  "ne oldu?" diye baktığında tek yere bakmak istiyor.
// ============================================================

// İşlem kodlarının okunabilir karşılıkları ve renkleri.
//
// NEDEN BACKEND'DE DEĞİL DE BURADA?
// Bu bir SUNUM meselesi. Backend "rol_degisti" diyor — makine kodu,
// sabit ve güvenilir. Ekranda ne yazacağı arayüzün kararı.
//
// ⚠️ Anahtarlar backend'deki DenetimIslemi sabitleriyle BİREBİR aynı
// olmalı (Services/DenetimKaydi.cs).
const ISLEM_BILGI = {
  rol_degisti:           { yazi: 'Rol Değişti',          renk: '#8e44ad' },
  pasiflestirildi:       { yazi: 'Pasifleştirildi',      renk: '#e74c3c' },
  aktiflestirildi:       { yazi: 'Aktifleştirildi',      renk: '#27ae60' },
  yorum_gizlendi:        { yazi: 'Yorum Gizlendi',       renk: '#f39c12' },
  yorum_gosterildi:      { yazi: 'Yorum Gösterildi',     renk: '#2563eb' },

  basvuru_onaylandi:     { yazi: 'Başvuru Onaylandı',    renk: '#27ae60' },
  basvuru_reddedildi:    { yazi: 'Başvuru Reddedildi',   renk: '#e74c3c' },
  sozlesme_guncellendi:  { yazi: 'Sözleşme Güncellendi', renk: '#0891b2' },

  // Para hareketi yaratan iki işlem. Renkleri bilerek belirgin:
  // denetim listesinde göz önce bunlara takılmalı.
  para_iadesi:           { yazi: 'Para İadesi',          renk: '#d97706' },
  siparis_iptal_admin:   { yazi: 'Sipariş İptali',       renk: '#dc2626' },

  // ⭐ YENİ — paraya ve envantere dokunan işlemler.
  //
  // ⚠️ Renk seçimi bilgi taşıyor: FİYAT değiştirenler turuncu/kırmızı
  // tonda (denetimde en çok bakılan satırlar), yapısal değişiklikler
  // nötr mavi/gri. Hepsini aynı renge boyamak, fiyat değişikliğini
  // kategori adı değişikliğiyle aynı ağırlıkta göstermek olurdu.
  indirim_uygulandi:     { yazi: 'İndirim Uygulandı',    renk: '#d97706' },
  indirim_kaldirildi:    { yazi: 'İndirim Kaldırıldı',   renk: '#d97706' },

  urun_eklendi:          { yazi: 'Ürün Eklendi',         renk: '#27ae60' },
  urun_guncellendi:      { yazi: 'Ürün Güncellendi',     renk: '#0891b2' },
  urun_silindi:          { yazi: 'Ürün Silindi',         renk: '#dc2626' },
  urun_arsivlendi:       { yazi: 'Ürün Arşivlendi',      renk: '#64748b' },
  urun_arsivden_cikarildi: { yazi: 'Arşivden Çıkarıldı', renk: '#64748b' },
  stok_duzeltildi:       { yazi: 'Stok Düzeltildi',      renk: '#0891b2' },

  kupon_olusturuldu:     { yazi: 'Kupon Oluşturuldu',    renk: '#27ae60' },
  kupon_guncellendi:     { yazi: 'Kupon Güncellendi',    renk: '#0891b2' },
  kupon_silindi:         { yazi: 'Kupon Silindi',        renk: '#dc2626' },

  kampanya_eklendi:      { yazi: 'Banner Eklendi',       renk: '#27ae60' },
  kampanya_guncellendi:  { yazi: 'Banner Güncellendi',   renk: '#0891b2' },
  kampanya_silindi:      { yazi: 'Banner Silindi',       renk: '#dc2626' },

  kategori_eklendi:      { yazi: 'Kategori Eklendi',     renk: '#27ae60' },
  kategori_guncellendi:  { yazi: 'Kategori Güncellendi', renk: '#0891b2' },
  kategori_silindi:      { yazi: 'Kategori Silindi',     renk: '#dc2626' },

  ice_aktarma_baslatildi:{ yazi: 'Excel İçe Aktarma',    renk: '#8e44ad' },
};

// Sözlükte olmayan bir kod gelirse ekran ÇÖKMEMELİ. Ham kodu gösterip
// nötr bir renk veriyoruz — çirkin ama çalışıyor ve eksiklik hemen
// görünüyor.
function islemBilgisi(kod) {
  return ISLEM_BILGI[kod] ?? { yazi: kod, renk: '#64748b' };
}

// ⚠️ Hedef bir KİŞİ mi, bir VARLIK mı?
//
// Backend varlık etiketlerini "Tür: değer" biçiminde yazıyor
// (DenetimEtiketi). Kişi adında iki nokta olmaz. Ayrım gerekli çünkü
// kişi adı tıklanabilir (kullanıcı detayına gider), varlık etiketi
// değil — "Ürün: Kahve (#42)" için /kullanicilar/43 açmak yanlış
// sayfaya götürürdü.
function hedefKisiMi(hedef) {
  return typeof hedef === 'string' && !hedef.includes(':');
}

export default function DenetimSekmesi({ baslangic, bitis }) {
  const navigate = useNavigate();

  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const [arama, setArama] = useState('');
  const [islemFiltre, setIslemFiltre] = useState('');

  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(25);

  async function getir() {
    setYukleniyor(true);
    setHata('');

    try {
      const p = new URLSearchParams();

      if (arama.trim() !== '') p.append('arama', arama.trim());
      if (islemFiltre !== '') p.append('islem', islemFiltre);
      if (baslangic !== '') p.append('baslangic', baslangic);
      if (bitis !== '') p.append('bitis', bitis);

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
  // "Ahmet" yazan kullanıcı 5 istek tetiklerdi ve cevaplar sırasız
  // dönerse ekranda yanlış sonuç kalabilirdi.
  useEffect(() => {
    const sayac = setTimeout(getir, 400);

    return () => clearTimeout(sayac);
  }, [arama, islemFiltre, baslangic, bitis, sayfa, sayfaBoyutu]);

  // Filtre değişince 1. sayfaya dön.
  // ⚠️ Bağımlılıkta "sayfa" YOK: olsaydı sonsuz döngü olurdu.
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

      // Adı tıklanabilir yapıyoruz: denetim kaydına bakan kişi "bu
      // admin başka ne yapmış" diye merak eder.
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
      baslik: 'Kime / Neye',
      hucre: (l) =>
        hedefKisiMi(l.hedef) ? (
          <button
            className="denetim-kisi-link"
            onClick={() => navigate('/kullanicilar/' + l.hedefId)}
          >
            {l.hedef}
          </button>
        ) : (
          // Varlık etiketi: tıklanabilir değil.
          // ⚠️ Ürün/kupon sayfasına link vermek CAZİP ama yanlış:
          // kayıt SİLİNMİŞ bir ürüne de ait olabilir ve o link
          // "bulunamadı" sayfasına götürürdü.
          <span className="denetim-varlik">{l.hedef}</span>
        ),
    },
    {
      baslik: 'Değişiklik',
      hucre: (l) => <DegerGosterimi eski={l.eski} yeni={l.yeni} />,
    },
    {
      baslik: 'IP',

      // ⚠️ Eski kayıtlarda boş: IP sütunu sonradan eklendi ve geriye
      // dönük doldurulmadı. "—" boş bırakmaktan iyi: sütunun var
      // olduğunu ama bu satırda bilgi olmadığını söylüyor.
      hucre: (l) => l.ip || <span className="denetim-bos">—</span>,
    },
    {
      baslik: 'Ne Zaman',
      hucre: (l) => tarihBicimle(l.tarih),
    },
  ];

  return (
    <>
      <div className="filtre-cubugu">
        <div className="filtre-grup" style={{ flex: 1, minWidth: 220 }}>
          <span className="filtre-etiket">Ara</span>

          <AramaKutusu
            deger={arama}
            degistir={setArama}
            ipucu="Kişi adı veya etkilenen kayıt..."
          />
        </div>

        <div className="filtre-grup">
          <span className="filtre-etiket">İşlem Tipi</span>

          {/* ⭐ Seçenekler SUNUCUDAN geliyor, sabit liste değil.
              Backend'e yeni bir işlem tipi eklendiğinde bu menü
              kendiliğinden büyür. */}
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
          <div className="log-not">
            Bu kayıtlar <b>silinmez ve değiştirilemez</b>. Denetim izinin
            değeri, güvenilir olmasından gelir.
          </div>

          <Tablo
            sutunlar={sutunlar}
            veriler={veri?.loglar ?? []}
            anahtar={(l) => l.id}
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

          {/* ⚠️ Sayım üst sınıra takıldıysa söyle. "1000 kayıt" yazıp
              geçmek yanlış bir kesinlik yaratırdı; sayının tam olması
              için her sayfa yüklemesinde tam tarama gerekirdi. */}
          {veri?.toplamAsildi && (
            <div className="log-not">
              1000'den fazla kayıt var — tam sayı hesaplanmıyor. Daraltmak
              için tarih aralığını veya filtreyi kullan.
            </div>
          )}
        </>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';

import { apiGet, apiPut } from '../../services/api';
import { sayiBicimle, tarihBicimle } from '../../utils/bicimlendir';

import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';
import Buton from '../Buton';
import OzetKart from '../OzetKart';
import OnayPenceresi from '../OnayPenceresi';

// ============================================================
//  DÜŞÜK PUANLI YORUMLAR + MODERASYON
//
//  Bu rapor diğerlerinden farklı: sadece OKUMUYOR, EYLEM de
//  yapıyor (yorum gizle / göster).
//
//  ⚠️ NEDEN GİZLİ YORUMLAR DA LİSTELENİYOR?
//  Müşteri tarafında gizli yorumları saklıyoruz. Ama bu ADMİN
//  ekranı: gizlediği yorumu bir daha göremezse yanlışlıkla
//  gizlediğini geri alamaz. Gizleme "silme" değildir; yönetici
//  için görünür kalmalı.
//
//  Bunun yerine gizli satırları soluk gösterip "Göster"
//  butonu sunuyoruz.
// ============================================================
export default function YorumRaporu({ baslangic, bitis }) {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // Kaç yıldıza kadar listelensin.
  //
  // Sekmeye ÖZEL bir filtre olduğu için kabukta değil burada.
  // Diğer 8 sekme bunu hiç kullanmıyor.
  const [maxPuan, setMaxPuan] = useState(2);

  // Onay penceresi durumu.
  //
  // Tek bir state'te hem "açık mı" hem "hangi yorum" bilgisini
  // tutuyoruz: null = kapalı, nesne = o yorum için açık.
  //
  // Neden ayrı bir "acik" bool'u yok? Çünkü türetilebilir:
  // onayHedefi !== null zaten "açık" demek. İki state tutsaydık
  // biri true diğeri null kalabilir ve pencere boş açılırdı.
  const [onayHedefi, setOnayHedefi] = useState(null);

  // İşlem sürerken butonları kilitlemek için.
  const [islemde, setIslemde] = useState(false);

  async function getir() {
    setYukleniyor(true);
    setHata('');

    try {
      const p = new URLSearchParams();

      if (baslangic !== '') {
        p.append('baslangic', baslangic);
      }

      if (bitis !== '') {
        p.append('bitis', bitis);
      }

      p.append('maxPuan', maxPuan);

      setVeri(await apiGet('/admin/reports/yorumlar?' + p.toString()));
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    getir();
  }, [baslangic, bitis, maxPuan]);


  // ---------- GÖRÜNÜRLÜK DEĞİŞTİRME ----------
  async function gorunurlukDegistir() {
    if (!onayHedefi) {
      return;
    }

    setIslemde(true);

    try {
      // Gizliyse "goster", değilse "gizle" ucuna gidiyoruz.
      // Adres NİYETİ taşıyor; tek uca "gizle=true/false"
      // göndermek yanlış parametreyle ters işlem riski doğururdu.
      const eylem = onayHedefi.gizli ? 'goster' : 'gizle';

      await apiPut('/admin/reviews/' + onayHedefi.yorumId + '/' + eylem);

      // ⚠️ Pencereyi API ÇAĞRISINDAN SONRA kapatıyoruz.
      //
      // Önce kapatsaydık ve istek başarısız olsaydı, kullanıcı
      // işlemin olduğunu sanırdı. Hata fırlatan çağrıdan sonraki
      // satırlar çalışmaz — bunu doğruluk lehine kullanıyoruz.
      setOnayHedefi(null);

      // Listeyi tazele: sunucudaki gerçek durumu tekrar okuyoruz.
      //
      // Alternatif, yerel state'i elle güncellemekti (iyimser
      // güncelleme). Burada tercih etmedik: bu bir rapor ekranı,
      // saniyelik gecikme sorun değil; sunucudan okumak ise
      // "ekranda gördüğün = veritabanındaki" garantisini verir.
      await getir();
    } catch (e) {
      setHata(e.message);
      setOnayHedefi(null);
    } finally {
      setIslemde(false);
    }
  }

  const sutunlar = [
    {
      baslik: 'Puan',
      hizala: 'orta',

      // Yıldızı metin olarak çiziyoruz: 2 puan → ★★☆☆☆
      // repeat() ile dolu ve boş yıldızları birleştiriyoruz.
      hucre: (y) => (
        <span className="yorum-yildiz" title={y.puan + ' yıldız'}>
          {'★'.repeat(y.puan)}
          <span className="yorum-yildiz-bos">{'★'.repeat(5 - y.puan)}</span>
        </span>
      ),
    },
    {
      baslik: 'Ürün',
      hucre: (y) => <span className="musteri-ad">{y.urunAdi}</span>,
    },
    {
      baslik: 'Müşteri',
      hucre: (y) => <span className="musteri-mail">{y.musteri}</span>,
    },
    {
      baslik: 'Yorum',

      // Uzun yorumlar tabloyu şişirmesin; tam metin title'da.
      hucre: (y) => (
        <span className="yorum-metin" title={y.yorum}>
          {y.yorum}
        </span>
      ),
    },
    {
      baslik: 'Tarih',
      hucre: (y) => tarihBicimle(y.tarih),
    },
    {
      baslik: 'İşlem',
      hizala: 'sag',
      hucre: (y) => (
        <Buton
          tip={y.gizli ? 'ikincil' : 'tehlike'}
          boyut="kucuk"
          onClick={() => setOnayHedefi(y)}
        >
          {y.gizli ? '👁 Göster' : '🚫 Gizle'}
        </Buton>
      ),
    },
  ];

  return (
    <div>
      <div className="ozet-izgara">
        <OzetKart
          ikon="⭐"
          etiket="Düşük Puanlı Yorum"
          deger={sayiBicimle(veri?.toplam ?? 0)}
          renk="#f39c12"
        />

        <OzetKart
          ikon="🚫"
          etiket="Gizlenmiş"
          deger={sayiBicimle(veri?.gizliSayisi ?? 0)}
          renk="#8e44ad"
        />
      </div>

      {/* ---- PUAN EŞİĞİ ---- */}
      <div className="rapor-bilgi">
        <label className="tarih-etiket">
          En Fazla Puan

          <select
            className="tarih-girdi"
            value={maxPuan}
            onChange={(e) => setMaxPuan(Number(e.target.value))}
          >
            <option value={1}>1 yıldız</option>
            <option value={2}>2 yıldıza kadar</option>
            <option value={3}>3 yıldıza kadar</option>
            <option value={5}>Tüm yorumlar</option>
          </select>
        </label>

        <span>
          Gizlenen yorum müşteriye gösterilmez ve <b>puan ortalamasına
          girmez</b>. Kayıt silinmez, buradan geri açılabilir.
        </span>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={getir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Yorumlar getiriliyor..." />
      ) : (
        <Tablo
          sutunlar={sutunlar}
          veriler={veri?.yorumlar ?? []}
          anahtar={(y) => y.yorumId}
          bosMesaj="Bu dönemde bu puanın altında yorum yok."

          /* Gizli satırlar soluk görünsün — listede kalıyorlar
             ama "bu yayında değil" bilgisi bir bakışta okunmalı. */
          satirSinifi={(y) => (y.gizli ? 'yorum-gizli-satir' : '')}
        />
      )}

      {/* ---- ONAY PENCERESİ ---- */}
      {/*
        Yıkıcı olmayan bir işlem için de onay soruyoruz çünkü
        etkisi müşteriye görünür (yorum kaybolur, ürün puanı
        değişir). Ama buton KIRMIZI DEĞİL: işlem geri alınabilir,
        kırmızıyı gerçekten geri alınamaz işlemlere saklıyoruz.
      */}
      <OnayPenceresi
        acik={onayHedefi !== null}

        baslik={onayHedefi?.gizli ? 'Yorumu tekrar göster' : 'Yorumu gizle'}

        mesaj={
          onayHedefi?.gizli
            ? 'Bu yorum tekrar müşterilere gösterilecek ve ürünün puan ortalamasına dahil edilecek.'
            : 'Bu yorum müşterilere gösterilmeyecek ve ürünün puan ortalamasından çıkarılacak. Kayıt silinmez, istediğin zaman geri açabilirsin.'
        }

        onayla={gorunurlukDegistir}
        iptal={() => setOnayHedefi(null)}
        islemde={islemde}

        /* ⭐ Yeni proplar — metin ve renk işleme göre */
        onayYazi={onayHedefi?.gizli ? 'Evet, Göster' : 'Evet, Gizle'}
        islemdeYazi="İşleniyor..."
        onayTipi={onayHedefi?.gizli ? 'ana' : 'tehlike'}
      />
    </div>
  );
}
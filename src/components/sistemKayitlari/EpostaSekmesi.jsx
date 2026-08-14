import { useEffect, useState } from 'react';

import { apiGet, apiPost } from '../../services/api';
import { tarihBicimle } from '../../utils/bicimlendir';

import AramaKutusu from '../AramaKutusu';
import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';
import Sayfalama from '../Sayfalama';
import Buton from '../Buton';

import { Send } from 'lucide-react';

// ============================================================
//  E-POSTA SEKMESİ
//
//  ⚠️ Bu tablo "GÖNDERDİK Mİ" sorusunu cevaplıyor, "ULAŞTI MI"
//  sorusunu DEĞİL. Teslimat/açılma bilgisi Brevo panelinde
//  (app.brevo.com → Logs). İkisi farklı ve ekran bunu söylemeli;
//  aksi hâlde "başarılı" yazan bir satır teslim sanılır.
// ============================================================
export default function EpostaSekmesi({ baslangic, bitis }) {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const [arama, setArama] = useState('');
  const [olay, setOlay] = useState('');
  const [sonuc, setSonuc] = useState('');

  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(25);

  // Hangi satır şu an gönderiliyor? (butonu kilitlemek için)
  //
  // ⚠️ Tek bir "gonderiliyor" boolean'ı yetmezdi: liste 25 satır ve
  // hepsinin butonu birden kilitlenirdi. Satırın id'sini tutmak,
  // yalnızca tıklananı kilitliyor.
  const [gonderilenId, setGonderilenId] = useState(null);

  async function getir() {
    setYukleniyor(true);
    setHata('');

    try {
      const p = new URLSearchParams();

      if (arama.trim() !== '') p.append('arama', arama.trim());
      if (olay !== '') p.append('olay', olay);
      if (sonuc !== '') p.append('sonuc', sonuc);
      if (baslangic !== '') p.append('baslangic', baslangic);
      if (bitis !== '') p.append('bitis', bitis);

      p.append('page', sayfa);
      p.append('pageSize', sayfaBoyutu);

      setVeri(await apiGet('/admin/loglar/eposta?' + p.toString()));
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    const sayac = setTimeout(getir, 400);

    return () => clearTimeout(sayac);
  }, [arama, olay, sonuc, baslangic, bitis, sayfa, sayfaBoyutu]);

  useEffect(() => {
    setSayfa(1);
  }, [arama, olay, sonuc, baslangic, bitis, sayfaBoyutu]);

  async function tekrarGonder(id) {
    setGonderilenId(id);
    setHata('');

    try {
      await apiPost('/admin/loglar/eposta/' + id + '/tekrar-gonder', {});

      // ⚠️ Listeyi SUNUCUDAN tazeliyoruz, state'i elle düzeltmiyoruz.
      // Tekrar gönderim yeni bir kayıt satırı da üretiyor; elle
      // güncelleseydik ekran o satırı göstermez, kullanıcı denemenin
      // kaydedilmediğini sanırdı.
      await getir();
    } catch (e) {
      setHata(e.message);
    } finally {
      setGonderilenId(null);
    }
  }

  const sutunlar = [
    {
      baslik: 'Sonuç',
      hucre: (k) => (
        <span
          className="denetim-etiket"
          style={
            k.basarili
              ? { backgroundColor: 'var(--yumusakBasari)', color: 'var(--basari)' }
              : { backgroundColor: 'var(--yumusakHata)', color: 'var(--hata)' }
          }
        >
          {k.basarili ? 'Gönderildi' : 'Gitmedi'}
        </span>
      ),
    },
    { baslik: 'Olay', hucre: (k) => k.olay },
    { baslik: 'Alıcı', hucre: (k) => k.alici || <span className="denetim-bos">—</span> },
    { baslik: 'Konu', hucre: (k) => k.konu },
    {
      baslik: 'Not',

      // Hata mesajı ile sağlayıcı kimliği AYNI hücrede: ikisi de
      // "sonucun ayrıntısı" ve satır başına yalnızca biri dolu.
      // İki ayrı sütun, her satırda birini boş bırakırdı.
      hucre: (k) =>
        k.hataMesaji ? (
          <span className="log-hata-metin">{k.hataMesaji}</span>
        ) : k.mesajId ? (
          <span className="log-kisik" title={k.mesajId}>
            {k.mesajId}
          </span>
        ) : (
          <span className="denetim-bos">—</span>
        ),
    },
    { baslik: 'Ne Zaman', hucre: (k) => tarihBicimle(k.tarih) },
    {
      baslik: '',
      hizala: 'sag',

      // ⚠️ Buton yalnızca gövdesi saklanan (yani gitmemiş) kayıtlarda
      // çıkıyor. Başarılı gönderimlerde gövde bilerek saklanmıyor —
      // sipariş içeriğini ikinci kez arşivlememek için.
      hucre: (k) =>
        k.tekrarGonderilebilir ? (
          <Buton
            tip="ikincil"
            boyut="kucuk"
            ikonRengi="ana"
            disabled={gonderilenId === k.id}
            onClick={() => tekrarGonder(k.id)}
            title="Aynı maili tekrar göndermeyi dener"
          >
            <Send size={14} />{' '}
            {gonderilenId === k.id ? 'Gönderiliyor...' : 'Tekrar Gönder'}
          </Buton>
        ) : null,
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
            ipucu="Alıcı adresi veya konu..."
          />
        </div>

        <div className="filtre-grup">
          <span className="filtre-etiket">Olay</span>

          <select
            className="filtre-secim"
            value={olay}
            onChange={(e) => setOlay(e.target.value)}
          >
            <option value="">Tümü</option>

            {(veri?.ek?.olaylar ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="filtre-grup">
          <span className="filtre-etiket">Sonuç</span>

          <select
            className="filtre-secim"
            value={sonuc}
            onChange={(e) => setSonuc(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="basarili">Gönderilenler</option>
            <option value="hata">Gitmeyenler</option>
          </select>
        </div>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={getir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="E-posta kayıtları getiriliyor..." />
      ) : (
        <>
          <div className="log-not">
            Bu liste <b>gönderim</b> kaydıdır, teslimat kaydı değil.
            "Gönderildi" mailin sağlayıcıya kabul edildiğini söyler;
            kutuya düşüp düşmediği Brevo panelinde görünür.
          </div>

          <Tablo
            sutunlar={sutunlar}
            veriler={veri?.kayitlar ?? []}
            anahtar={(k) => k.id}
            bosMesaj="Bu filtreye uyan e-posta kaydı yok."
          />

          <Sayfalama
            sayfa={sayfa}
            toplamSayfa={veri?.toplamSayfa ?? 1}
            toplam={veri?.toplam ?? 0}
            sayfaBoyutu={sayfaBoyutu}
            sayfaDegistir={setSayfa}
            boyutDegistir={setSayfaBoyutu}
          />

          {veri?.toplamAsildi && (
            <div className="log-not">
              1000'den fazla kayıt var — tam sayı hesaplanmıyor.
            </div>
          )}
        </>
      )}
    </>
  );
}

import { createContext, useContext, useState, useEffect } from 'react';
import { temalar } from '../theme/tema';

const TemaContext = createContext();

export function TemaProvider({ children }) {
  // Tarayıcıda daha önce seçilmiş tema var mı? Yoksa 'acik' ile başla.
  const [temaAdi, setTemaAdi] = useState(() => {
    return localStorage.getItem('admin_tema') || 'acik';
  });

  const renkler = temalar[temaAdi];

  // TEMA HER DEĞİŞTİĞİNDE: renkleri CSS değişkenlerine yaz.
  // Böylece her CSS dosyasında var(--anaRenk) yazabileceğiz.
  useEffect(() => {
    const kok = document.documentElement; // <html> etiketi

    // tema.js'teki her rengi tek tek CSS değişkenine çevir
    // örn: anaRenk: '#2563eb'  →  --anaRenk: #2563eb
    Object.keys(renkler).forEach((anahtar) => {
      kok.style.setProperty('--' + anahtar, renkler[anahtar]);
    });

    // Seçimi hatırla (sayfa yenilenince kaybolmasın)
    localStorage.setItem('admin_tema', temaAdi);
  }, [temaAdi, renkler]);

  // Açık <-> Koyu arasında geçiş yapar
  function temayiDegistir() {
    setTemaAdi(temaAdi === 'acik' ? 'koyu' : 'acik');
  }

  return (
    <TemaContext.Provider value={{ renkler, temaAdi, temayiDegistir }}>
      {children}
    </TemaContext.Provider>
  );
}

// Her bileşenden kolayca kullanmak için kısayol
export function useTema() {
  return useContext(TemaContext);
}
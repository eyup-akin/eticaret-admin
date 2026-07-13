import './Buton.css';

// tip   : 'ana' | 'ikincil' | 'tehlike'
// boyut : 'normal' | 'kucuk'
// ...digerleri : onClick, disabled, type gibi her şey <button>'a aynen geçer
export default function Buton({
  tip = 'ana',
  boyut = 'normal',
  children,
  ...digerleri
}) {
  const siniflar = [
    'buton',
    'buton-' + tip,
    boyut === 'kucuk' ? 'buton-kucuk' : '',
  ].join(' ');

  return (
    <button className={siniflar} {...digerleri}>
      {children}
    </button>
  );
}
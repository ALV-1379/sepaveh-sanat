import { Globe2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { publicPath } from '../../features/catalog';

const languages = [
  { locale: 'fa-IR', label: 'فا' },
  { locale: 'en-US', label: 'EN' },
];

export function LanguageSwitcher({ locale, path, query }) {
  const navigate = useNavigate();

  function changeLanguage(nextLocale) {
    const search = query.toString();
    navigate(publicPath(nextLocale, path) + (search ? `?${search}` : ''));
  }

  return <fieldset className="language-switcher">
    <legend>Language</legend>
    <Globe2 aria-hidden="true" size={16} />
    {languages.map((language) => <label key={language.locale}>
      <input
        checked={locale === language.locale}
        name="site-language"
        onChange={() => changeLanguage(language.locale)}
        type="radio"
        value={language.locale}
      />
      <span>{language.label}</span>
    </label>)}
  </fieldset>;
}

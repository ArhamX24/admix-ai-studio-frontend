interface LanguageSelectorProps {
  language: 'hindi' | 'english';
  onLanguageChange: (language: 'hindi' | 'english') => void;
}

const LanguageSelector = ({ language, onLanguageChange }: LanguageSelectorProps) => {
  return (
    <div className="language-selector">
      <div className="language-tabs">
        <button
          className={`lang-tab ${language === 'hindi' ? 'active' : ''}`}
          onClick={() => onLanguageChange('hindi')}
        >
          🇮🇳 Hindi
        </button>
        <button
          className={`lang-tab ${language === 'english' ? 'active' : ''}`}
          onClick={() => onLanguageChange('english')}
        >
          🇬🇧 English
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector;

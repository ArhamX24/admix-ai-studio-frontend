interface TextInputProps {
  text: string;
  onChange: (text: string) => void;
  language: 'hindi' | 'english';
}

const TextInput = ({ text, onChange, language }: TextInputProps) => {
  const placeholder = language === 'hindi' 
    ? 'यहाँ अपना टेक्स्ट टाइप करें या पेस्ट करें...'
    : 'Type or paste your text here...';

  return (
    <div className="text-input-container">
      <textarea
        className="text-input"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        maxLength={5000}
      />
      <div className="char-count">
        {text.length} / 5000
      </div>
    </div>
  );
};

export default TextInput;
